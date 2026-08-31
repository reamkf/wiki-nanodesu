#!/usr/bin/env bun

/**
 * Google Sheets APIを使用してスプレッドシートからデータを取得し、CSVファイルとして保存するスクリプト
 *
 * 使用方法:
 * 1. .envファイルにGOOGLE_SPREADSHEET_IDとGOOGLE_API_KEYを設定
 * 2. bun run fetch-csv を実行
 * 3. --commit オプションを指定すると、変更があった場合に自動的にgit add/commitを実行します
 *    例: bun run fetch-csv --commit
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';

// 環境変数を読み込み
dotenv.config();

const ANSI = {
	reset: '\x1b[0m',
	green: '\x1b[32m',
	red: '\x1b[31m',
	yellow: '\x1b[33m',
	dim: '\x1b[2m'
} as const;

function logInfo(message: string, ...args: unknown[]): void {
	console.log(`${ANSI.dim}${message}${ANSI.reset}`, ...args);
}

function logSuccess(message: string, ...args: unknown[]): void {
	console.log(`${ANSI.green}${message}${ANSI.reset}`, ...args);
}

function logWarn(message: string, ...args: unknown[]): void {
	console.warn(`${ANSI.yellow}${message}${ANSI.reset}`, ...args);
}

function logError(message: string, ...args: unknown[]): void {
	console.error(`${ANSI.red}${message}${ANSI.reset}`, ...args);
}

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
// リクエスト制御: クールタイムと再試行設定
const COOLDOWN_MS = Number(process.env.SHEETS_COOLDOWN_MS ?? '1200');
const MAX_RETRIES = Number(process.env.SHEETS_MAX_RETRIES ?? '5');
const INITIAL_BACKOFF_MS = Number(process.env.SHEETS_INITIAL_BACKOFF_MS ?? '1000');
const BACKOFF_MULTIPLIER = Number(process.env.SHEETS_BACKOFF_MULTIPLIER ?? '2');

function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

let lastRequestAt = 0;
async function waitForCooldown(): Promise<void> {
	const now = Date.now();
	const elapsed = now - lastRequestAt;
	if (elapsed < COOLDOWN_MS) {
		const waitMs = COOLDOWN_MS - elapsed;
		await sleep(waitMs);
	}
}

async function fetchWithRetry(url: string): Promise<Response> {
	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		await waitForCooldown();
		lastRequestAt = Date.now();
		try {
			const response = await fetch(url);
			if (response.ok) {
				return response;
			}
			const status = response.status;
			if (status === 429 || status >= 500) {
				let delayMs: number | undefined;
				const retryAfter = response.headers.get('retry-after');
				if (retryAfter) {
					const seconds = Number(retryAfter);
					if (!Number.isNaN(seconds)) {
						delayMs = Math.max(COOLDOWN_MS, seconds * 1000);
					}
				}
				if (delayMs === undefined) {
					const base = INITIAL_BACKOFF_MS * Math.pow(BACKOFF_MULTIPLIER, attempt);
					const jitter = Math.floor(Math.random() * 250);
					delayMs = Math.max(COOLDOWN_MS, base + jitter);
				}
				if (attempt < MAX_RETRIES) {
					logWarn(`   Google Sheets API 呼び出しに失敗しました(status=${status})。 ${delayMs}ms 後に再試行します。`);
					await sleep(delayMs);
					continue;
				}
				const errorText = await response.text();
				throw new Error(`Google Sheets API 呼び出しが再試行上限に達しました: ${status} ${response.statusText}\n詳細: ${errorText}`);
			}
			const errorText = await response.text();
			throw new Error(`Google Sheets API エラー: ${status} ${response.statusText}\n詳細: ${errorText}`);
		} catch (err) {
			if (attempt < MAX_RETRIES) {
				const base = INITIAL_BACKOFF_MS * Math.pow(BACKOFF_MULTIPLIER, attempt);
				const jitter = Math.floor(Math.random() * 250);
				const delayMs = Math.max(COOLDOWN_MS, base + jitter);
				logWarn(`   Google Sheets API 呼び出しに失敗しました(${err instanceof Error ? err.message : String(err)})。 ${delayMs}ms 後に再試行します。`);
				await sleep(delayMs);
				continue;
			}
			throw err;
		}
	}
	throw new Error('Google Sheets API 呼び出しに失敗しました。');
}

const sheetConfigs: SheetConfig[] = [
	{
		sheetName: 'フレンズデータ',
		filePath: 'csv/フレンズデータ.csv',
		range: {
			startColumn: 1,
			endColumn: 103
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
		sheetName: 'イベントデータ',
		filePath: 'csv/イベントデータ.csv',
		range: {
			startColumn: 1,
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

	// カンマ、ダブルクォート、または改行を含む場合はエスケープ
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
	const range = generateA1Notation(config.sheetName, config);

	const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?key=${apiKey}`;

	try {
		const response = await fetchWithRetry(url);

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Google Sheets API エラー: ${response.status} ${response.statusText}\n詳細: ${errorText}`);
		}

		const data = await response.json();

		if (!data.values || data.values.length === 0) {
			logWarn(`   ⚠️  シート「${config.sheetName}」にデータがありません。スキップします。`);
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
		}

		// 実際のデータの最大列数
		// const actualMaxColumns = Math.max(...values.map(row => row.length));

		// CSVデータに変換
		const csvData = arrayToCsv(values, expectedColumns);

		// ファイルパスのディレクトリを作成（存在しない場合）
		const dir = path.dirname(config.filePath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		// CSVファイルとして保存
		fs.writeFileSync(config.filePath, csvData, 'utf8');

	} catch (error) {
		logError(`   ❌ シート「${config.sheetName}」の処理でエラーが発生しました:`, error);
		throw error;
	}
}

/**
 * メイン処理
 */
async function main(): Promise<void> {
	logInfo('🦉 Google Sheets からCSVファイルを取得中...');

	const args = process.argv.slice(2);
	const shouldCommit = args.includes('--commit');

	try {
		// APIキーを取得
		const apiKey = getApiKey();

		// 各シート設定に基づいてデータを処理
		let successCount = 0;
		let errorCount = 0;

		for (const config of sheetConfigs) {
			try {
				await processSheet(apiKey, config);
				successCount++;
			} catch (error) {
				logError(`シート「${config.sheetName}」の処理に失敗しました:`, error);
				errorCount++;
			}
		}

		logSuccess(`成功: ${successCount}ファイル`);
		if (errorCount > 0) {
			logError(`失敗: ${errorCount}ファイル`);
		}

		if (errorCount > 0) {
			process.exit(1);
		}

		if (shouldCommit) {
			try {
				let diffExists = false;
				try {
					execSync('git diff --exit-code csv/*.csv').toString();
				} catch {
					diffExists = true;
				}
				if (diffExists) {
					execSync('git add csv/*.csv');
					execSync('git commit -m "chore: update csv files"');
					logSuccess('差分が見つかりました。コミットしました。');
				} else {
					logInfo('差分はありませんでした。');
				}

			} catch (error) {
				logError('❌ gitのコミットに失敗しました:', error);
				process.exit(1);
			}
		}
	} catch (error) {
		logError('❌ 処理中にエラーが発生しました:', error);
		process.exit(1);
	}
}

// スクリプトが直接実行された場合のみmain関数を実行
if (import.meta.main) {
	main();
}
