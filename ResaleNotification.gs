function resaleNotificationTrigger() {
  var debug_mode = false; // true => Run scraping but not post to Twitter

  var matchMasterSheet = SpreadsheetApp.getActive().getSheetByName('MatchMaster');
  var matchMasterValues = matchMasterSheet.getRange(2, 1, matchMasterSheet.getLastRow(), matchMasterSheet.getLastColumn()).getValues();

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
      var status_txt = '【リセールチケット新着情報】' +
        '\n' + cupTitle + ' ' + homeTeam + ' v ' + awayTeam +
        '\n' + gameDate + ' @ ' + stadium +
        '\n' + ticketUrlBitly +
        '\n\n' + homeTeamHashTag + ' ' + awayTeamHashTag;
      status_txt = status_txt.substr(0, 140) // 140文字制限

      // リセール有無判定 → Tweet
      if (html_JLeagueTicket.indexOf('リセールへ') !== -1) {
        debug_mode ? Logger.log('[DEBUG]\nTweet Done:\n' + status_txt) : Twitter.tweet(status_txt);
      } else {
        Logger.log('No resale ticket available');
      }
      // -----END リセール有無取得-----


      // -----BEGIN リセール詳細取得-----
      // // TODO: 席種毎リセールURL取得
      // var resaleUrlList = Parser.data(html_JLeagueTicket)
      //   .from('')
      //   .to('')
      //   .build();
      //
      // // TODO: 「席種毎リセールURL」ページ毎にScraping
      // for (var i_resaleUrlList = 0; i_resaleUrlList < resaleUrlList.length; i_resaleUrlList++) {
      //   var html_JLeagueTicket_resalePage = UrlFetchApp.fetch(resaleUrlList[i_resaleUrlList]).getContentText();
      //
      //   // TODO: 席種・枚数・価格・URLを取得
      //   var resaleSeat_type = Parser.data(html_JLeagueTicket_resalePage)
      //     .from('')
      //     .to('')
      //     .build();
      //
      //   var resaleSeat_quantity = Parser.data(html_JLeagueTicket_resalePage)
      //     .from('')
      //     .to('')
      //     .build();
      //
      //   var resaleSeat_price = Parser.data(html_JLeagueTicket_resalePage)
      //     .from('')
      //     .to('')
      //     .build();
      //
      //   var resaleSeat_url = Parser.data(html_JLeagueTicket_resalePage)
      //     .from('')
      //     .to('')
      //     .build();
      //
      //   // -----リセールURL毎に新規出品か判定-----
      //   for (var i_resaleSeat_url = 0; i_resaleSeat_url < resaleSeat_url.length; i_resaleSeat_url++) {
      //     // 出力先シート作成
      //     var seatPriceSheet = SpreadsheetApp.getActive().getSheetByName('ResaleNotification_' + matchId + '_' + cupTitle + '_' + homeTeam + 'v' + awayTeam);
      //     if (seatPriceSheet === null) {
      //       var seatPriceSheet_org = SpreadsheetApp.getActive().getSheetByName('ResaleNotificationMaster');
      //       seatPriceSheet_org.activate();
      //       SpreadsheetApp.getActive().duplicateActiveSheet().setName('ResaleNotification_' + matchId + '_' + cupTitle + '_' + homeTeam + 'v' + awayTeam);
      //       seatPriceSheet = SpreadsheetApp.getActive().getSheetByName('ResaleNotification_' + matchId + '_' + cupTitle + '_' + homeTeam + 'v' + awayTeam);
      //     }
      //
      //     // 既存リセールデータ取得
      //     var lastRow_seatPriceSheet = seatPriceSheet.getLastRow();
      //     var lastCol_seatPriceSheet = seatPriceSheet.getLastColumn();
      //     var seatPriceSheetValues = seatPriceSheet.getRange(2, 1, matchMasterSheet.getLastRow(), matchMasterSheet.getLastColumn()).getValues();
      //
      //     // リセールURLの一致を判定
      //     for (var i_seatPriceSheetValues = 0; i_seatPriceSheetValues < seatPriceSheetValues.length; i_seatPriceSheetValues++) {
      //       if (resaleSeat_url[i_resaleSeat_url] === seatPriceSheetValues[4][i_seatPriceSheetValues]) {
      //         // シート出力
      //         seatPriceSheet.getRange(lastRow_seatPriceSheet + 1, 1).setValue(new Date());
      //         seatPriceSheet.getRange(lastRow_seatPriceSheet + 1, 2).setValue(resaleSeat_type[i_resaleSeat_url]);
      //         seatPriceSheet.getRange(lastRow_seatPriceSheet + 1, 3).setValue(resaleSeat_quantity[i_resaleSeat_url]);
      //         seatPriceSheet.getRange(lastRow_seatPriceSheet + 1, 4).setValue(resaleSeat_price[i_resaleSeat_url]);
      //         seatPriceSheet.getRange(lastRow_seatPriceSheet + 1, 4).setValue(resaleSeat_url[i_resaleSeat_url]);
      //
      //         // Tweet
      //         var status_txt = '【リセールチケット新着情報】' +
      //           '\n' + cupTitle + ' ' + homeTeam + ' v ' + awayTeam +
      //           '\n' + gameDate + ' @ ' + stadium +
      //           '\n\n席種: ' + resaleSeat_type[i_resaleSeat_url] +
      //           '\n数量: ' + resaleSeat_quantity[i_resaleSeat_url] +
      //           '\n価格: ' + resaleSeat_price[i_resaleSeat_url] +
      //           '\nURL: ' + createBitlyUrl(resaleSeat_url[i_resaleSeat_url]) +
      //           '\n\n' + homeTeamHashTag + ' ' + awayTeamHashTag;
      //         status_txt = status_txt.substr(0, 140) // 140文字制限
      //
      //         debug_mode ? Logger.log('[DEBUG]\nTweet Done:\n' + status_txt) : Twitter.tweet(status_txt);
      //       }
      //     }
      //   }
      // }
      // -----END リセール詳細取得-----

    } catch (e) {
      Logger.log('[Error] ' + e);
    }
  }
}
