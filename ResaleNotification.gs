function resaleNotificationTrigger() {
  var debug_mode = false; // true => Run scraping but not post to Twitter

  var matchMasterSheet = SpreadsheetApp.getActive().getSheetByName('MatchMaster');
  var matchMasterValues = matchMasterSheet.getRange(2, 1, matchMasterSheet.getLastRow(), matchMasterSheet.getLastColumn()).getValues();

  var resaleNotificationSheet = SpreadsheetApp.getActive().getSheetByName('ResaleNotification_2020');
  var resaleNotificationValues = resaleNotificationSheet.getRange(2, 1, resaleNotificationSheet.getLastRow(), resaleNotificationSheet.getLastColumn()).getValues();

  // 毎時10分または40分にスクレイピング実行 (Jリーグチケットが30分おきに空席状況を更新するため)
  var dateNow = new Date();
  if (dateNow.getMinutes() === 10 || dateNow.getMinutes() === 40) {
    Utilities.sleep(9000); // Jリーグチケット更新反映を加味しNミリ秒待機
    // -----試合毎にScraping実施-----
    for (var i_matchMasterValues = 0; i_matchMasterValues < matchMasterValues.length - 1; i_matchMasterValues++) {
      try {
        // -----matchMasterSheetデータ取得-----
        var matchId = matchMasterValues[i_matchMasterValues][0];
        var ticketUrl = 'https://www.jleague-ticket.jp/sales/perform/' + matchId + '/001'; // TODO: リセールURLへ修正
        var ticketUrlBitly = createBitlyUrl(ticketUrl);
        var cupTitle = matchMasterValues[i_matchMasterValues][1];
        var homeTeam = matchMasterValues[i_matchMasterValues][2];
        var awayTeam = matchMasterValues[i_matchMasterValues][3];
        var homeTeamHashTag = matchMasterValues[i_matchMasterValues][4];
        var awayTeamHashTag = matchMasterValues[i_matchMasterValues][5];

        Logger.log(cupTitle + ' ' + homeTeam + ' v ' + awayTeam);

        // -----Scraping_JLeagueTicket-----
        var html_JLeagueTicket = UrlFetchApp.fetch(ticketUrl).getContentText();
        // Parser: from().to()はfromとtoに挟まれた部分を抜き出します。build()で文字列、iterate()で文字列の配列が得られます。

        // GameInfo情報取得
        // 試合日・スタジアム
        var doc_date = Parser.data(html_JLeagueTicket)
          .from('<span class="day">')
          .to('</span>')
          .iterate();
        var gameDate = doc_date[0] + ' ' + doc_date[1];

        var doc_stadium_div = Parser.data(html_JLeagueTicket)
          .from('<div class="game-info-stat-place">')
          .to('</div>')
          .build();
        var doc_stadium = Parser.data(doc_stadium_div)
          .from('<span>')
          .to('</span>')
          .iterate();
        var stadium = doc_stadium[0];

        // -----BEGIN リセール有無取得-----
        var status_txt = '【リセールチケット残席あり】' +
          '\n' + cupTitle + ' ' + homeTeam + ' v ' + awayTeam +
          '\n' + gameDate + ' @ ' + stadium +
          '\n' + ticketUrlBitly +
          '\n(' + formatDate(dateNow, 'yyyy/MM/dd HH:mm') + '時点)' +
          '\n' + homeTeamHashTag + ' ' + awayTeamHashTag;
        status_txt = status_txt.substr(0, 140) // 140文字制限

        // リセール有無判定 → Tweet
        if (html_JLeagueTicket.indexOf('リセールへ') !== -1) {
          Logger.log('Resale ticket available');

          for (var i_resaleNotificationValues = resaleNotificationValues.length - 1; i_resaleNotificationValues >= 0; i_resaleNotificationValues--) {
            var matchId_resaleNotificationValues = resaleNotificationValues[i_resaleNotificationValues][1];
            var hasReleaseTicket = resaleNotificationValues[i_resaleNotificationValues][5];

            if (matchId === matchId_resaleNotificationValues) {
              // Write to sheet
              var newRow_resaleNotificationSheet = resaleNotificationSheet.getLastRow() + 1;
              resaleNotificationSheet.getRange(newRow_resaleNotificationSheet, 1).setValue(dateNow);
              resaleNotificationSheet.getRange(newRow_resaleNotificationSheet, 2).setValue(matchId);
              resaleNotificationSheet.getRange(newRow_resaleNotificationSheet, 3).setValue(cupTitle);
              resaleNotificationSheet.getRange(newRow_resaleNotificationSheet, 4).setValue(homeTeam);
              resaleNotificationSheet.getRange(newRow_resaleNotificationSheet, 5).setValue(awayTeam);
              resaleNotificationSheet.getRange(newRow_resaleNotificationSheet, 6).setValue(true);

              if (hasReleaseTicket === false) {
                // 直近でリセール無しの場合のみTweet
                debug_mode ? Logger.log('[DEBUG]\nTweet Done:\n' + status_txt) : Twitter.tweet(status_txt);
              }
              break;
            }
          }
        } else {
          Logger.log('No resale ticket available');

          // Write to sheet
          var newRow_resaleNotificationSheet = resaleNotificationSheet.getLastRow() + 1;
          resaleNotificationSheet.getRange(newRow_resaleNotificationSheet, 1).setValue(dateNow);
          resaleNotificationSheet.getRange(newRow_resaleNotificationSheet, 2).setValue(matchId);
          resaleNotificationSheet.getRange(newRow_resaleNotificationSheet, 3).setValue(cupTitle);
          resaleNotificationSheet.getRange(newRow_resaleNotificationSheet, 4).setValue(homeTeam);
          resaleNotificationSheet.getRange(newRow_resaleNotificationSheet, 5).setValue(awayTeam);
          resaleNotificationSheet.getRange(newRow_resaleNotificationSheet, 6).setValue(false);
        }

        // -----END リセール有無取得-----
      } catch (e) {
        Logger.log('[Error] ' + e);
      }
    }
  }
}
