/*!
 * MasterPresenter
 *
 * Copyright (c) 2023 OR-Sasaki
 * Modified by reamkf
 *
 * Released under the MIT license.
 * see https://opensource.org/licenses/MIT
 */

// ================== Setting =======================
const branchName = "main"

// シート別設定（配列形式）
const sheetConfigs = [
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
		sheetName: '状態異常',
		filePath: 'csv/状態異常.csv',
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
			endColumn: 14
		}
	}
]

// ================== Add menu =======================

function onOpen() {
	const customMenu = SpreadsheetApp.getUi()
	customMenu.createMenu('マスタインポート')
			.addItem('実行', 'convertCsv')
			.addItem('設定確認', 'showSettings')
			.addToUi()
}

// 設定を表示する関数
function showSettings() {
	const ui = SpreadsheetApp.getUi();
	let settingsText = "現在の設定:\n\n";

	for (const config of sheetConfigs) {
		settingsText += `【${config.sheetName}】\n`;
		settingsText += `- 保存先: ${config.filePath}\n`;

		// 範囲設定（省略可能）
		if (config.range) {
			const startRow = config.range.startRow || 1;
			const endRow = config.range.endRow ? `${config.range.endRow}行目` : '最終行';
			const startCol = config.range.startColumn || 1;
			const endCol = config.range.endColumn ? `${config.range.endColumn}列目` : '最終列';

			settingsText += `- 範囲: ${startRow}行目から${endRow}、${startCol}列目から${endCol}\n`;
		} else {
			settingsText += `- 範囲: シート全体\n`;
		}

		settingsText += "\n";
	}

	settingsText += `ブランチ: ${branchName}\n`;

	ui.alert('シート設定', settingsText, ui.ButtonSet.OK);
}

// ================== CSV =======================

function convertCsv() {
	var spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
	var contents = [];

	// 設定に基づいてシートを処理
	for (const config of sheetConfigs) {
		const sheet = spreadSheet.getSheetByName(config.sheetName);
		if (!sheet) {
			Logger.log(`シート「${config.sheetName}」が見つかりません。スキップします。`);
			continue;
		}

		// データ範囲を決定
		let dataRange;

		if (config.range) {
			const lastRow = sheet.getLastRow();
			const lastCol = sheet.getLastColumn();

			// 範囲パラメータの取得（デフォルト値または指定値）
			const startRow = config.range.startRow || 1;
			const endRow = config.range.endRow || lastRow;
			const startCol = config.range.startColumn || 1;
			const endCol = config.range.endColumn || lastCol;

			// 実際のデータが存在する範囲に調整
			const actualEndRow = Math.min(endRow, lastRow);
			const actualEndCol = Math.min(endCol, lastCol);

			// 指定範囲のデータを取得
			const numRows = actualEndRow - startRow + 1;
			const numCols = actualEndCol - startCol + 1;

			if (numRows > 0 && numCols > 0) {
				dataRange = sheet.getRange(startRow, startCol, numRows, numCols);
			} else {
				Logger.log(`シート「${config.sheetName}」の指定範囲が無効です。スキップします。`);
				continue;
			}
		} else {
			// 範囲指定がない場合はシート全体を対象に
			dataRange = sheet.getDataRange();
		}

		// シートからデータを取得
		var values = dataRange.getValues();

		// 各行の値を適切にCSVフォーマットに変換
		var csvRows = values.map(row =>
			row.map(cell => {
				if (cell === null || cell === undefined) return '';
				const value = String(cell);
				// カンマまたはダブルクォートを含む場合は適切にエスケープ
				if (value.includes(',') || value.includes('"')) {
					return `"${value.replace(/"/g, '""')}"`;
				}
				return value;
			}).join(',')
		);

		contents.push({
			"text": csvRows.join('\n'),
			"filePath": config.filePath
		});
	}

	if (contents.length > 0) {
		doCommit(contents);
	} else {
		SpreadsheetApp.getUi().alert('エラー', '処理対象のシートが見つかりませんでした。', SpreadsheetApp.getUi().ButtonSet.OK);
	}
}

// ================== GitHub =======================

function doCommit(contents) {
	var refSha = getRefSha();
	var parentCommit = getCommit(refSha);
	var blobContents = [];

	contents.forEach(function(content) {
		var blobContent = {
			"blobSha": getBlobSha(content["text"]),
			"filePath": content["filePath"]
		};
		blobContents.push(blobContent);
	});

	var tree = createTree(parentCommit["tree"]["sha"], blobContents);
	var createdCommit = createCommit(parentCommit["sha"], tree["sha"]);
	var ref = updateRef(createdCommit["sha"]);

	if (ref) {
		SpreadsheetApp.getUi().alert('成功', '全てのシートのCSVデータがGitHubにプッシュされました。', SpreadsheetApp.getUi().ButtonSet.OK);
	}
}

function getRefSha() {
	var requestUrl = urlBase + "git/refs/heads/" + branchName;
	var sha = fetchGet(requestUrl)["object"]["sha"];
	Logger.log("getRefSha: " + sha);
	return sha;
}

function getCommit(sha) {
	var requestUrl = urlBase + "git/commits/" + sha;
	var commit = fetchGet(requestUrl);
	Logger.log("getCommit: " + commit);
	return commit;
}

function getBlobSha(content) {
	var requestUrl = urlBase + "git/blobs";
	var payload = { "content": content, "encoding": "utf-8" };
	var blob = fetchPost(requestUrl, payload);
	var sha = blob["sha"];
	Logger.log("getBlobSha: " + sha);
	return sha;
}

function createTree(treeSha, contents) {
	var requestUrl = urlBase + "git/trees";
	var payload = {
		"base_tree": treeSha,
		"tree": []
	};

	contents.forEach(function(content) {
		payload["tree"].push({
			"path": content["filePath"],
			"mode": "100644",
			"type": "blob",
			"sha": content["blobSha"]
		});
	});

	var tree = fetchPost(requestUrl, payload);
	Logger.log("createTree: " + tree);
	return tree;
}

function createCommit(parentCommitSha, treeSha) {
	var requestUrl = urlBase + "git/commits";
	var userEmail = Session.getActiveUser().getEmail();
	var payload = {
		"message": "Import MasterData on " + Utilities.formatDate(new Date(), 'JST', 'yyyy-MM-dd  HH:mm:ss'),
		"author": {
			"name": userEmail,
			"email": userEmail,
			"date": Date.now
		},
		"parents": [
			parentCommitSha
		],
		"tree": treeSha
	};
	var commit = fetchPost(requestUrl, payload);
	Logger.log("createCommit: " + commit);
	return commit;
}

function updateRef(commitSha) {
	var requestUrl = urlBase + "git/refs/heads/" + branchName;
	var payload = {
		"sha": commitSha,
		"force": false
	};
	var ref = fetchPost(requestUrl, payload);
	Logger.log("updateRef: " + ref);
	return ref;
}

// ================== API Base =======================

const repositoryName = PropertiesService.getScriptProperties().getProperty("REPOSITORY_NAME");
const urlBase = "https://api.github.com/repos/" + repositoryName + "/";
const token = PropertiesService.getScriptProperties().getProperty("GITHUB_TOKEN");
var headers = {
	"Accept": "application/vnd.github+json",
	"Authorization": "Bearer " + token
};

function fetchGet(requestUrl) {
	var requestOptions = {
		"method": "get",
		"headers": headers
	};

	var response = UrlFetchApp.fetch(requestUrl, requestOptions);
	var contentText = response.getContentText();
	Logger.log(">>>>>>>[GET]【" + requestUrl + "】 "+ contentText);
	return JSON.parse(contentText);
}

function fetchPost(requestUrl, payload = {}) {
	var requestOptions = {
		"method": "post",
		"headers": headers,
		"payload": JSON.stringify(payload),
		"Content-Type": "application/json"
	};

	var response = UrlFetchApp.fetch(requestUrl, requestOptions);
	var contentText = response.getContentText();
	Logger.log(">>>>>>>[POST]【" + requestUrl + "】 " + contentText);
	return JSON.parse(contentText);
}