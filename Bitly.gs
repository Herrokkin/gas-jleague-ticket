// -----Bitly-----
// https://dev.bitly.com/v4/#operation/createBitlink
function createBitlyUrl(url) {
  var BITLY_OAUTH_TOKEN = PropertiesService.getScriptProperties().getProperty('BITLY_OAUTH_TOKEN');
  var endpoint = 'https://api-ssl.bitly.com/v4/shorten';
  var headers = {
    'Authorization': 'Bearer ' + BITLY_OAUTH_TOKEN
  }
  var data = {
    "long_url": url
  }
  var options = {
    'method': 'POST',
    'contentType': 'application/json',
    'headers': headers,
    'payload': JSON.stringify(data)
  }
  var result = UrlFetchApp.fetch(endpoint, options);
  var json = JSON.parse(result.getContentText('utf-8'));
  return json.link;
}
