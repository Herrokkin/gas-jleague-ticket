// -----Bitly-----
// https://dev.bitly.com/links.html#v3_shorten
function createBitlyUrl(url) {
  var BITLY_OAUTH_TOKEN = PropertiesService.getScriptProperties().getProperty('BITLY_OAUTH_TOKEN');
  var endpoint = 'https://api-ssl.bitly.com/v3/shorten?access_token=' + BITLY_OAUTH_TOKEN + '&longUrl=' + url;
  var result = UrlFetchApp.fetch(endpoint, {
    method: 'GET',
    contentType: 'application/json;'
  });
  var json = JSON.parse(result.getContentText('utf-8'));
  return json.data.url;
}
