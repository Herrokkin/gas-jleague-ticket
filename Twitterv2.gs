/*
REFERENCE
Google Apps ScriptからTwitter APIをOAuth2.0認証で使う【GAS】
https://officeforest.org/wp/2023/01/14/google-apps-script%e3%81%8b%e3%82%89twitter-api%e3%82%92oauth2-0%e8%aa%8d%e8%a8%bc%e3%81%a7%e4%bd%bf%e3%81%86/
*/

// 認証用の各種変数
var appid = PropertiesService.getScriptProperties().getProperty('TWITTER_CONSUMER_KEY_v2');
var appsecret = PropertiesService.getScriptProperties().getProperty('TWITTER_CONSUMER_SECRET_v2');
var scope = "tweet.write tweet.read users.read offline.access"
var authurl = "https://twitter.com/i/oauth2/authorize"
var tokenurl = "https://api.twitter.com/2/oauth2/token"

// Tweet Endpoint
var endpoint2 = "https://api.twitter.com/2/tweets";
var getpoint = "https://api.twitter.com/2/tweets/search/recent?query="; //ツイートを検索取得する為のエンドポイント

function startoauth() {
  // UIを取得する
  var ui = SpreadsheetApp.getUi();

  // 認証済みかチェックする
  var service = checkOAuth();
  if (!service.hasAccess()) {
    // 認証画面を出力
    var output = HtmlService.createHtmlOutputFromFile('template').setHeight(450).setWidth(500).setSandboxMode(HtmlService.SandboxMode.IFRAME);
    ui.showModalDialog(output, 'OAuth2.0認証');
  } else {
    // 認証済みなので終了する
    ui.alert("すでに認証済みです。");
  }
}

// アクセストークンURLを含んだHTMLを返す関数
function authpage() {
  var service = checkOAuth();
  var authorizationUrl = service.getAuthorizationUrl();

  console.log(authorizationUrl)


  var html = "<center><b><a href='" + authorizationUrl + "' target='_blank' onclick='closeMe();'>アクセス承認</a></b></center>"
  return html;
}

// 認証チェック
function checkOAuth() {
  pkceChallengeVerifier();
  const prop = PropertiesService.getUserProperties();

  return OAuth2.createService("twitter")
    .setAuthorizationBaseUrl(authurl)
    .setTokenUrl(tokenurl + '?code_verifier=' + prop.getProperty("code_verifier"))
    .setClientId(appid)
    .setClientSecret(appsecret)
    .setScope(scope)
    .setCallbackFunction("authCallback")　// 認証を受けたら受け取る関数を指定する
    .setPropertyStore(PropertiesService.getScriptProperties())  // スクリプトプロパティに保存する
    .setParam("response_type", "code")
    .setParam('code_challenge_method', 'S256')
    .setParam('code_challenge', prop.getProperty("code_challenge"))
    .setTokenHeaders({
      'Authorization': 'Basic ' + Utilities.base64Encode(appid + ':' + appsecret),
      'Content-Type': 'application/x-www-form-urlencoded'
    })
}

// 認証コールバック
function authCallback(request) {
  var service = checkOAuth();
  var isAuthorized = service.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput("認証に成功しました。ページを閉じてください。");
  } else {
    return HtmlService.createHtmlOutput("認証に失敗しました。");
  }
}

// ログアウト
function reset() {
  checkOAuth().reset();
  SpreadsheetApp.getUi().alert("ログアウトしました。")
}

function pkceChallengeVerifier() {
  var prop = PropertiesService.getUserProperties();
  if (!prop.getProperty("code_verifier")) {
    var verifier = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

    for (var i = 0; i < 128; i++) {
      verifier += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    var sha256Hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, verifier)

    var challenge = Utilities.base64Encode(sha256Hash)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    prop.setProperty("code_verifier", verifier)
    prop.setProperty("code_challenge", challenge)
  }
}

/*
REFERENCE
Google Apps ScriptからTwitter APIをOAuth2.0認証で使う【GAS】
https://officeforest.org/wp/2023/01/14/google-apps-script%e3%81%8b%e3%82%89twitter-api%e3%82%92oauth2-0%e8%aa%8d%e8%a8%bc%e3%81%a7%e4%bd%bf%e3%81%86/
*/

/* 
Call Back URL: https://script.google.com/macros/d/1l1WidACYep6ZHv0z-7sM7x2O3j5jigqcQmLcyOubXrYTtX5tKoWY4G9p/usercallback
Client ID: ZDFiNU1YTUxiRU1ndmVyYVZIcFA6MTpjaQ
Client Secret: sxUkFJkvqBF5vcn3A3Mt74okfIMwo5ugmvXxh8mFS_j-hTcd2s
*/

// 認証用の各種変数
var appid = PropertiesService.getScriptProperties().getProperty('TWITTER_CONSUMER_KEY_v2');
var appsecret = PropertiesService.getScriptProperties().getProperty('TWITTER_CONSUMER_SECRET_v2');
var scope = "tweet.write tweet.read users.read offline.access"
var authurl = "https://twitter.com/i/oauth2/authorize"
var tokenurl = "https://api.twitter.com/2/oauth2/token"

// Tweet Endpoint
var endpoint2 = "https://api.twitter.com/2/tweets";
var getpoint = "https://api.twitter.com/2/tweets/search/recent?query="; //ツイートを検索取得する為のエンドポイント

function startoauth() {
  // UIを取得する
  var ui = SpreadsheetApp.getUi();

  // 認証済みかチェックする
  var service = checkOAuth();
  if (!service.hasAccess()) {
    // 認証画面を出力
    var output = HtmlService.createHtmlOutputFromFile('template').setHeight(450).setWidth(500).setSandboxMode(HtmlService.SandboxMode.IFRAME);
    ui.showModalDialog(output, 'OAuth2.0認証');
  } else {
    // 認証済みなので終了する
    ui.alert("すでに認証済みです。");
  }
}

// アクセストークンURLを含んだHTMLを返す関数
function authpage() {
  var service = checkOAuth();
  var authorizationUrl = service.getAuthorizationUrl();

  console.log(authorizationUrl)


  var html = "<center><b><a href='" + authorizationUrl + "' target='_blank' onclick='closeMe();'>アクセス承認</a></b></center>"
  return html;
}

// 認証チェック
function checkOAuth() {
  pkceChallengeVerifier();
  const prop = PropertiesService.getUserProperties();

  return OAuth2.createService("twitter")
    .setAuthorizationBaseUrl(authurl)
    .setTokenUrl(tokenurl + '?code_verifier=' + prop.getProperty("code_verifier"))
    .setClientId(appid)
    .setClientSecret(appsecret)
    .setScope(scope)
    .setCallbackFunction("authCallback")　// 認証を受けたら受け取る関数を指定する
    .setPropertyStore(PropertiesService.getScriptProperties())  // スクリプトプロパティに保存する
    .setParam("response_type", "code")
    .setParam('code_challenge_method', 'S256')
    .setParam('code_challenge', prop.getProperty("code_challenge"))
    .setTokenHeaders({
      'Authorization': 'Basic ' + Utilities.base64Encode(appid + ':' + appsecret),
      'Content-Type': 'application/x-www-form-urlencoded'
    })
}

// 認証コールバック
function authCallback(request) {
  var service = checkOAuth();
  var isAuthorized = service.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput("認証に成功しました。ページを閉じてください。");
  } else {
    return HtmlService.createHtmlOutput("認証に失敗しました。");
  }
}

// ログアウト
function reset() {
  checkOAuth().reset();
  SpreadsheetApp.getUi().alert("ログアウトしました。")
}

function pkceChallengeVerifier() {
  var prop = PropertiesService.getUserProperties();
  if (!prop.getProperty("code_verifier")) {
    var verifier = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

    for (var i = 0; i < 128; i++) {
      verifier += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    var sha256Hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, verifier)

    var challenge = Utilities.base64Encode(sha256Hash)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    prop.setProperty("code_verifier", verifier)
    prop.setProperty("code_challenge", challenge)
  }
}

function post_tweet_v2(text, in_reply_to_tweet_id) {
  // message本文
  if (in_reply_to_tweet_id) {
    var message = {
      text: text,
      reply: {
        in_reply_to_tweet_id: in_reply_to_tweet_id
      }
    }
  } else {
    var message = {
      text: text
    }
  }

  // トークン確認
  var service = checkOAuth();
  if (service.hasAccess()) {
    // リクエスト実行
    const response = UrlFetchApp.fetch(endpoint2, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      },
      muteHttpExceptions: true,
      payload: JSON.stringify(message),
      contentType: "application/json"
    });

    // リクエスト結果を取得する
    const result = JSON.parse(response.getContentText());

    // リクエスト結果を表示
    console.log(JSON.stringify(result, null, 2));
    return result;

  } else {
    console.log("認証が実行されていませんよ。");
  }
}
