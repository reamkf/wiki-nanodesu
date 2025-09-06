#!/usr/bin/env bun

/**
 * Google Sheets APIを使用してスプレッドシートからデータを取得し、CSVファイルとして保存するスクリプト
 *
 * 使用方法:
 * 1. .envファイルにGOOGLE_SPREADSHEET_IDとGOOGLE_API_KEYを設定
 * 2. bun run fetch-csv を実行
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';

// 環境変数を読み込み
dotenv.config();

// シート設定（GASのsheetConfigsと同等）
interface SheetConfig {
	sheetName: string;
	filePath: string;
	range?: {
		startRow?: number;
		endRow?: number;
		startColumn?: number;
		endColumn?: number;
	};
}

// スプレッドシートID（README.mdに記載のURL内のID）
const SPREADSHEET_ID = '1p-C3wbkYZf_2Uce2J2J6w6T1V6X5eJmk-PtC4I__olk';

const sheetConfigs: SheetConfig[] = [
	{
		sheetName: 'フレンズデータ',
		filePath: 'csv/フレンズデータ.csv',
		range: {
			startColumn: 1,
			endColumn: 102
		}
	},
	{
		sheetName: 'フォトデータ',
		filePath: 'csv/フォトデータ.csv'
	},
	{
		sheetName: '状態異常スキル一覧',
		filePath: 'csv/状態異常スキル一覧.csv',
		range: {
			startColumn: 1,
			endColumn: 11
		}
	},
	{
		sheetName: 'スキル別フレンズ一覧',
		filePath: 'csv/スキル別フレンズ一覧.csv'
	},
	{
		sheetName: 'フレンズ掛け合い一覧',
		filePath: 'csv/フレンズ掛け合い一覧.csv',
		range: {
			startColumn: 4,
			endColumn: 15
		}
	},
	{
		sheetName: 'フォト火力データCSV用',
		filePath: 'csv/フォト火力データ.csv',
		range: {
			startColumn: 1,
			endColumn: 4
		}
	}
];

/**
 * 環境変数をチェックしてAPIキーを取得
 */
function getApiKey(): string {
	const apiKey = process.env.GOOGLE_API_KEY;

	if (!apiKey) {
		throw new Error('GOOGLE_API_KEYが設定されていません。.envファイルを確認してください。');
	}

	return apiKey;
}

/**
 * A1記法でセル範囲を指定する文字列を生成
 */
function generateA1Notation(sheetName: string, config: SheetConfig): string {
	if (!config.range) {
		return sheetName;
	}

	const { startRow = 1, endRow, startColumn = 1, endColumn } = config.range;

	// 列番号をアルファベットに変換（A=1, B=2, ...）
	const columnToLetter = (col: number): string => {
		let result = '';
		while (col > 0) {
			col--;
			result = String.fromCharCode(65 + (col % 26)) + result;
			col = Math.floor(col / 26);
		}
		return result;
	};

	const startColumnLetter = columnToLetter(startColumn);
	const endColumnLetter = endColumn ? columnToLetter(endColumn) : '';

	if (endRow && endColumn) {
		return `${sheetName}!${startColumnLetter}${startRow}:${endColumnLetter}${endRow}`;
	} else if (endColumn) {
		return `${sheetName}!${startColumnLetter}${startRow}:${endColumnLetter}`;
	} else if (endRow) {
		return `${sheetName}!${startColumnLetter}${startRow}:${startRow}`;
	} else {
		return `${sheetName}!${startColumnLetter}${startRow}:${startColumnLetter}`;
	}
}

/**
 * セルの値をCSV形式に適した文字列に変換
 */
function formatCellForCsv(cell: unknown): string {
	if (cell === null || cell === undefined) {
		return '';
	}

	const value = String(cell);

	// カンマ、ダブルクォート、または改行を含む場合は適切にエスケープ
	if (value.includes(',') || value.includes('"') || value.includes('\n')) {
		return `"${value.replace(/"/g, '""')}"`;
	}

	return value;
}

/**
 * 2次元配列をCSV文字列に変換
 * Google Sheets APIは行の末尾の空セルを省略するため、行の長さを統一する
 */
function arrayToCsv(data: unknown[][], expectedColumns?: number): string {
	if (data.length === 0) {
		return '';
	}

	// 最大列数を取得（expectedColumnsが指定されている場合はそれを使用）
	const maxColumns = expectedColumns ?? Math.max(...data.map(row => row.length));

	return data
		.map(row => {
			// 行の長さを最大列数に統一（足りない分は空文字で埋める）
			const paddedRow = Array.from({ length: maxColumns }, (_, index) => row[index] ?? '');
			return paddedRow.map(formatCellForCsv).join(',');
		})
		.join('\n');
}

/**
 * Google Sheets APIからデータを取得
 */
async function fetchSheetData(apiKey: string, config: SheetConfig): Promise<unknown[][]> {
	// A1記法での範囲指定を生成
	const range = generateA1Notation(config.sheetName, config);

	// Google Sheets API URL を構築
	const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?key=${apiKey}`;

	console.log(`   📍 範囲: ${range}`);
	console.log(`   🔗 API URL: ${url}`);

	try {
		const response = await fetch(url);

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Google Sheets API エラー: ${response.status} ${response.statusText}\n詳細: ${errorText}`);
		}

		const data = await response.json();

		if (!data.values || data.values.length === 0) {
			console.log(`   ⚠️  シート「${config.sheetName}」にデータがありません。スキップします。`);
			return [];
		}

		return data.values;

	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`シート「${config.sheetName}」のデータ取得に失敗しました: ${error.message}`);
		}
		throw error;
	}
}

/**
 * シートからデータを取得してCSVとして保存
 */
async function processSheet(apiKey: string, config: SheetConfig): Promise<void> {
	console.log(`📊 シート「${config.sheetName}」を処理中...`);

	try {
		// シートからデータを取得
		const values = await fetchSheetData(apiKey, config);

		if (values.length === 0) {
			return;
		}

		// 期待される列数を計算（範囲指定がある場合）
		let expectedColumns: number | undefined;
		if (config.range && config.range.endColumn && config.range.startColumn) {
			expectedColumns = config.range.endColumn - config.range.startColumn + 1;
			console.log(`   📏 範囲指定による期待列数: ${expectedColumns}`);
		}

		// 実際のデータの最大列数を確認
		const actualMaxColumns = Math.max(...values.map(row => row.length));
		console.log(`   📐 実際の最大列数: ${actualMaxColumns}`);

		// CSVデータに変換
		const csvData = arrayToCsv(values, expectedColumns);

		// ファイルパスのディレクトリを作成（存在しない場合）
		const dir = path.dirname(config.filePath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		// CSVファイルとして保存
		fs.writeFileSync(config.filePath, csvData, 'utf8');

		console.log(`   ✅ ${config.filePath} に保存しました（${values.length}行）`);

	} catch (error) {
		console.error(`   ❌ シート「${config.sheetName}」の処理でエラーが発生しました:`, error);
		throw error;
	}
}

/**
 * メイン処理
 */
async function main(): Promise<void> {
	console.log('🦉 Google Sheets APIを使用してCSVファイルを取得するのです...');

	try {
		// APIキーを取得
		const apiKey = getApiKey();
		console.log('🔗 Google Sheets API キーを確認しました');
		console.log(`📋 スプレッドシートID: ${SPREADSHEET_ID}`);

		// 各シート設定に基づいてデータを処理
		let successCount = 0;
		let errorCount = 0;

		for (const config of sheetConfigs) {
			try {
				await processSheet(apiKey, config);
				successCount++;
			} catch (error) {
				console.error(`シート「${config.sheetName}」の処理に失敗しました:`, error);
				errorCount++;
			}
		}

		console.log('\n🎉 処理完了！');
		console.log(`   ✅ 成功: ${successCount}ファイル`);
		if (errorCount > 0) {
			console.log(`   ❌ 失敗: ${errorCount}ファイル`);
		}

		if (errorCount > 0) {
			process.exit(1);
		}

		// gitのコミットを作成
		try {
			execSync('git add csv/*.csv');
			execSync('git commit -m "chore: update csv files"');
		} catch (error) {
			console.error('❌ gitのコミットに失敗しました:', error);
			process.exit(1);
		}

	} catch (error) {
		console.error('❌ 処理中にエラーが発生しました:', error);
		console.error('\n🔧 トラブルシューティング:');
		console.error('1. .envファイルが正しく設定されているか確認してください');
		console.error('2. Google Cloud ConsoleでGoogle Sheets APIが有効になっているか確認してください');
		console.error('3. APIキーがGoogle Sheets APIの使用権限を持っているか確認してください');
		console.error('4. スプレッドシートが公開されているか確認してください（APIキー認証の場合）');
		process.exit(1);
	}
}

// スクリプトが直接実行された場合のみmain関数を実行
if (import.meta.main) {
	main();
}
