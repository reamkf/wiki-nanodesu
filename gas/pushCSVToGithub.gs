/*!
 * MasterPresenter
 *
 * Copyright (c) 2023 OR-Sasaki
 *
 * Released under the MIT license.
 * see https://opensource.org/licenses/MIT
 */

// ================== Setting =======================
// ディレクトリ設定
const useDirectory = true
const directoryName = "csv"

// 削除する行設定
const doSplice = false
const spliceStartAt = 0
const spliceEndAt = 1

// ブランチ設定
const branchName = "main"

// ================== Add menu =======================

function onOpen() {
  const customMenu = SpreadsheetApp.getUi()
  customMenu.createMenu('マスタインポート')
      .addItem('実行', 'convertCsv')
      .addToUi()
}


// ================== CSV =======================

function convertCsv()
{
  var spreadSheet = SpreadsheetApp.getActiveSpreadsheet()
  var targetSheetNames = ['フレンズデータ', 'フォトデータ', 'スキル別フレンズ一覧']
  var sheets = targetSheetNames.map(name => spreadSheet.getSheetByName(name))
  var contents = []

  sheets.forEach(function(sheet){
    var values = sheet.getDataRange().getValues()
    if (doSplice) {
      values.splice(spliceStartAt,spliceEndAt)
    }

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
      "name": sheet.getName()
    })
  })

  doCommit(contents)
}


// ================== GitHub =======================

function doCommit(contents)
{
  var refSha = getRefSha()
  var parentCommit = getCommit(refSha)
  var blobContents = []
  contents.forEach(function(content){
    var blobContent = {
      "blobSha": getBlobSha(content["text"]),
      "name": content["name"]
    }
    blobContents.push(blobContent)
  })

  var tree = createTree(parentCommit["tree"]["sha"], blobContents)
  var createdCommit = createCommit(parentCommit["sha"], tree["sha"])
  var ref = updateRef(createdCommit["sha"])
}

function getRefSha()
{
  var requestUrl = urlBase + "git/refs/heads/" + branchName
  var sha = fetchGet(requestUrl)["object"]["sha"]
  Logger.log("getRefSha: " + sha)
  return(sha)
}

function getCommit(sha)
{
  var requestUrl = urlBase + "git/commits/" + sha
  var commit = fetchGet(requestUrl)
  Logger.log("getCommit: " + commit)
  return(commit)
}

function getBlobSha(content)
{
  var requestUrl = urlBase + "git/blobs"
  var contentBase64 = Utilities.base64Encode(content)
  var payload = { "content": content, "encoding": "utf-8" }
  var blob = fetchPost(requestUrl, payload)
  var sha = blob["sha"]
  Logger.log("getBlobSha: " + sha)
  return(sha)
}

function createTree(treeSha, contents)
{
  var requestUrl = urlBase + "git/trees"
  var payload = {
    "base_tree": treeSha,
    "tree": []
  }

  var rootPath = useDirectory ? (directoryName + "/") : ""

  contents.forEach(function(content){
    payload["tree"].push(
      {
        "path": rootPath + content["name"] + ".csv",
        "mode": "100644",
        "type": "blob",
        "sha": content["blobSha"]
      }
    )
  })

  var tree = fetchPost(requestUrl, payload)
  Logger.log("createTree: " + tree)
  return(tree)
}

function createCommit(parentCommitSha, treeSha)
{
  var requestUrl = urlBase + "git/commits"
  var userEmail = Session.getActiveUser().getEmail()
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
  }
  var commit = fetchPost(requestUrl, payload)
  Logger.log("createCommit: " + commit)
  return(commit)
}

function updateRef(commitSha)
{
  var requestUrl = urlBase + "git/refs/heads/" + branchName
  var payload = {
    "sha": commitSha,
    "force": false
  }
  var ref = fetchPost(requestUrl, payload)
  Logger.log("updateRef: " + ref)
  return(ref)
}


// ================== API Base =======================

const repositoryName = PropertiesService.getScriptProperties().getProperty("REPOSITORY_NAME")
const urlBase = "https://api.github.com/repos/" + repositoryName + "/"
const token = PropertiesService.getScriptProperties().getProperty("GITHUB_TOKEN");
var headers = {
  "Accept": "application/vnd.github+json",
  "Authorization": "Bearer " + token
}

function fetchGet(requestUrl)
{
  var requestOptions = {
    "method": "get",
    "headers": headers
  }

  var response = UrlFetchApp.fetch(requestUrl, requestOptions)
  var contentText = response.getContentText()
  Logger.log(">>>>>>>[GET]【" + requestUrl + "】 "+ contentText)
  return(JSON.parse(contentText))
}

function fetchPost(requestUrl, payload = {})
{
  var requestOptions = {
    "method": "post",
    "headers": headers,
    "payload": JSON.stringify(payload),
    "Content-Type": "application/json"
  }

  var response = UrlFetchApp.fetch(requestUrl, requestOptions)
  var contentText = response.getContentText()
  Logger.log(">>>>>>>[POST]【" + requestUrl + "】 " + contentText)
  return(JSON.parse(contentText))
}