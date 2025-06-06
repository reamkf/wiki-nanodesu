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
		sheetName: "フォト火力データCSV用",
		filePath: "csv/フォト火力データ.csv",
		range: {
			startColumn: 1,
			endColumn: 4,
		},
	},
];

// ================== Add menu =======================

function onOpen() {
	const customMenu = SpreadsheetApp.getUi();
	customMenu.createMenu('GitHub')
		.addItem('Push', 'convertCsv')
		.addItem('CSVプレビュー', 'previewCsv')
		.addItem('設定確認', 'showSettings')
		.addToUi();
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

	ui.alert("シート設定", settingsText, ui.ButtonSet.OK);
}

// ================== CSV Preview Function =======================
/**
 * 各シートのデータをCSV形式に変換し、ダイアログでプレビュー表示する関数
 */
function previewCsv() {
	const ui = SpreadsheetApp.getUi();
	const spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
	let htmlOutputContent = "";
	let hasContent = false;

	// 設定に基づいてシートを処理
	for (const config of sheetConfigs) {
		const sheet = spreadSheet.getSheetByName(config.sheetName);
		if (!sheet) {
			Logger.log(
				`シート「${config.sheetName}」が見つかりません。スキップします。`
			);
			htmlOutputContent += `<h2>シート「${config.sheetName}」 (ファイルパス: ${config.filePath})</h2>
                            <p style="color: red;">シートが見つかりません。スキップします。</p><hr>`;
			continue;
		}

		// データ範囲を決定
		let dataRange;
		if (config.range) {
			const lastRow = sheet.getLastRow();
			const lastCol = sheet.getLastColumn();

			const startRow = config.range.startRow || 1;
			const endRow = config.range.endRow || lastRow;
			const startCol = config.range.startColumn || 1;
			const endCol = config.range.endColumn || lastCol;

			const actualEndRow = Math.min(endRow, lastRow);
			const actualEndCol = Math.min(endCol, lastCol);

			const numRows = actualEndRow - startRow + 1;
			const numCols = actualEndCol - startCol + 1;

			if (numRows > 0 && numCols > 0) {
				dataRange = sheet.getRange(
					startRow,
					startCol,
					numRows,
					numCols
				);
			} else {
				Logger.log(
					`シート「${config.sheetName}」の指定範囲が無効です。スキップします。`
				);
				htmlOutputContent += `<h2>シート「${config.sheetName}」 (ファイルパス: ${config.filePath})</h2>
                              <p style="color: orange;">指定範囲が無効か、データがありません。スキップします。</p><hr>`;
				continue;
			}
		} else {
			dataRange = sheet.getDataRange();
			if (
				dataRange.getNumRows() === 0 ||
				dataRange.getNumColumns() === 0
			) {
				Logger.log(
					`シート「${config.sheetName}」にデータがありません。スキップします。`
				);
				htmlOutputContent += `<h2>シート「${config.sheetName}」 (ファイルパス: ${config.filePath})</h2>
                              <p style="color: orange;">シートにデータがありません。スキップします。</p><hr>`;
				continue;
			}
		}

		const values = dataRange.getValues();

		const csvRows = values.map((row) =>
			row
				.map((cell) => {
					if (cell === null || cell === undefined) return "";
					const value = String(cell);
					// カンマ、ダブルクォート、または改行を含む場合は適切にエスケープ
					if (
						value.includes(",") ||
						value.includes('"') ||
						value.includes("\n")
					) {
						return `"${value.replace(/"/g, '""')}"`;
					}
					return value;
				})
				.join(",")
		);
		const csvData = csvRows.join("\n");

		htmlOutputContent += `<h2>${config.sheetName} (ファイルパス: ${config.filePath})</h2>`;
		htmlOutputContent += `<textarea rows="10" style="width:95%; white-space: pre; overflow-wrap: normal; overflow-x: scroll; font-family: monospace;" readonly>${escapeHtml(
			csvData
		)}</textarea><hr>`;
		hasContent = true;
	}

	if (htmlOutputContent === "" && !hasContent) {
		// 全てのシート設定が処理できなかった場合
		ui.alert(
			"プレビューエラー",
			"処理対象の有効なシート設定が見つかりませんでした。",
			ui.ButtonSet.OK
		);
		return;
	}

	if (!hasContent && htmlOutputContent !== "") {
		// 何らかの理由で有効なコンテンツは生成されなかったが、エラーメッセージはある場合
		// この場合はダイアログを表示する（エラーメッセージのみのダイアログ）
	} else if (!hasContent) {
		// コンテンツもエラーメッセージもない場合（通常はありえないが念のため）
		ui.alert(
			"プレビューエラー",
			"表示するデータがありません。",
			ui.ButtonSet.OK
		);
		return;
	}

	const html = HtmlService.createHtmlOutput(htmlOutputContent)
		.setWidth(700)
		.setHeight(500);
	ui.showModalDialog(html, "CSVプレビュー");
}

/**
 * HTML特殊文字をエスケープするヘルパー関数
 * @param {string} text エスケープするテキスト
 * @return {string} エスケープされたテキスト
 */
function escapeHtml(text) {
	if (text === null || text === undefined) return "";
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

// ================== CSV =======================

function convertCsv() {
	var spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
	var contents = [];

	// 設定に基づいてシートを処理
	for (const config of sheetConfigs) {
		const sheet = spreadSheet.getSheetByName(config.sheetName);
		if (!sheet) {
			Logger.log(
				`シート「${config.sheetName}」が見つかりません。スキップします。`
			);
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
				dataRange = sheet.getRange(
					startRow,
					startCol,
					numRows,
					numCols
				);
			} else {
				Logger.log(
					`シート「${config.sheetName}」の指定範囲が無効か、データがありません。スキップします。`
				);
				continue;
			}
		} else {
			dataRange = sheet.getDataRange();
			if (
				dataRange.getNumRows() === 0 ||
				dataRange.getNumColumns() === 0
			) {
				Logger.log(
					`シート「${config.sheetName}」にデータがありません。スキップします。`
				);
				continue;
			}
		}

		// シートからデータを取得
		var values = dataRange.getValues();

		// 各行の値を適切にCSVフォーマットに変換
		var csvRows = values.map((row) =>
			row.map(cell => {
					if (cell === null || cell === undefined) return "";
					const value = String(cell);
					// カンマ、ダブルクォート、または改行を含む場合は適切にエスケープ
					if (
						value.includes(",") ||
						value.includes('"') ||
						value.includes("\n")
					) {
						return `"${value.replace(/"/g, '""')}"`;
					}
					return value;
				})
				.join(",")
		);

		contents.push({
			text: csvRows.join("\n"),
			filePath: config.filePath,
		});
	}

	if (contents.length > 0) {
		doCommit(contents);
	} else {
		SpreadsheetApp.getUi().alert(
			"Pushエラー",
			"処理対象の有効なCSVデータがありませんでした。",
			SpreadsheetApp.getUi().ButtonSet.OK
		);
	}
}

// ================== GitHub =======================

function doCommit(contents) {
	var refSha = getRefSha();
	var parentCommit = getCommit(refSha);
	var blobContents = [];

	contents.forEach(function (content) {
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
		SpreadsheetApp.getUi().alert(
			"成功",
			"全てのシートのCSVデータがGitHubにプッシュされました。",
			SpreadsheetApp.getUi().ButtonSet.OK
		);
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
	var payload = { content: content, encoding: "utf-8" };
	var blob = fetchPost(requestUrl, payload);
	var sha = blob["sha"];
	Logger.log("getBlobSha: " + sha);
	return sha;
}

function createTree(treeSha, contents) {
	var requestUrl = urlBase + "git/trees";
	var payload = {
		base_tree: treeSha,
		tree: [],
	};

	contents.forEach(function (content) {
		payload["tree"].push({
			path: content["filePath"],
			mode: "100644",
			type: "blob",
			sha: content["blobSha"],
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
		"message": "Import CSV from Google Sheets on " + Utilities.formatDate(new Date(), 'JST', 'yyyy-MM-dd HH:mm:ss'),
		"author": {
			"name": userEmail,
			"email": userEmail,
			"date": Date.now
		},
		parents: [parentCommitSha],
		tree: treeSha,
	};
	var commit = fetchPost(requestUrl, payload);
	Logger.log("createCommit: " + commit);
	return commit;
}

function updateRef(commitSha) {
	var requestUrl = urlBase + "git/refs/heads/" + branchName;
	var payload = {
		sha: commitSha,
		force: false,
	};
	var ref = fetchPost(requestUrl, payload);
	Logger.log("updateRef: " + ref);
	return ref;
}

// ================== API Base =======================

const repositoryName =
	PropertiesService.getScriptProperties().getProperty("REPOSITORY_NAME");
const urlBase = "https://api.github.com/repos/" + repositoryName + "/";
const token =
	PropertiesService.getScriptProperties().getProperty("GITHUB_TOKEN");
var headers = {
	Accept: "application/vnd.github+json",
	Authorization: "Bearer " + token,
};

function fetchGet(requestUrl) {
	var requestOptions = {
		method: "get",
		headers: headers,
		muteHttpExceptions: true, // エラー時にもレスポンスを取得するため
	};

	var response = UrlFetchApp.fetch(requestUrl, requestOptions);
	var contentText = response.getContentText();
	// Logger.log(">>>>>>>[GET]【" + requestUrl + "】 "+ contentText); // レスポンスが巨大な場合があるため、必要に応じてコメントアウト
	if (response.getResponseCode() >= 400) {
		Logger.log(
			"Error in fetchGet: " +
				response.getResponseCode() +
				" - " +
				contentText
		);
		SpreadsheetApp.getUi().alert(
			"GitHub APIエラー (GET)",
			`URL: ${requestUrl}\nStatus: ${response.getResponseCode()}\nResponse: ${contentText.substring(
				0,
				500
			)}`,
			SpreadsheetApp.getUi().ButtonSet.OK
		);
		throw new Error("GitHub API GET Error: " + response.getResponseCode());
	}
	return JSON.parse(contentText);
}

function fetchPost(requestUrl, payload = {}) {
	var requestOptions = {
		method: "post",
		headers: headers,
		payload: JSON.stringify(payload),
		contentType: "application/json",
		muteHttpExceptions: true, // エラー時にもレスポンスを取得するため
	};

	var response = UrlFetchApp.fetch(requestUrl, requestOptions);
	var contentText = response.getContentText();
	// Logger.log(">>>>>>>[POST]【" + requestUrl + "】 " + contentText); // レスポンスが巨大な場合があるため、必要に応じてコメントアウト
	if (response.getResponseCode() >= 400) {
		Logger.log(
			"Error in fetchPost: " +
				response.getResponseCode() +
				" - " +
				contentText
		);
		SpreadsheetApp.getUi().alert(
			"GitHub APIエラー (POST)",
			`URL: ${requestUrl}\nStatus: ${response.getResponseCode()}\nResponse: ${contentText.substring(
				0,
				500
			)}`,
			SpreadsheetApp.getUi().ButtonSet.OK
		);
		throw new Error("GitHub API POST Error: " + response.getResponseCode());
	}
	return JSON.parse(contentText);
}
