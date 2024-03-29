function seatPriceTrigger() {
  var matchMasterSheet = SpreadsheetApp.getActive().getSheetByName('MatchMaster');
  var matchMasterValues = matchMasterSheet.getRange(2, 1, matchMasterSheet.getLastRow(), matchMasterSheet.getLastColumn()).getValues();

  // -----BEGIN MatchMaster-----
  for (var i_matchMasterValues = 0; i_matchMasterValues < matchMasterValues.length - 1; i_matchMasterValues++) {
    try {
      // -----matchMasterSheetデータ取得-----
      var matchId = matchMasterValues[i_matchMasterValues][0];
      var ticketUrl = 'https://www.jleague-ticket.jp/sales/perform/' + matchId + '/001';
      var ticketUrlBitly = createBitlyUrl(ticketUrl);
      var cupTitle = matchMasterValues[i_matchMasterValues][1];
      var homeTeam = matchMasterValues[i_matchMasterValues][2];
      var awayTeam = matchMasterValues[i_matchMasterValues][3];
      var homeTeamHashTag = matchMasterValues[i_matchMasterValues][4];
      var awayTeamHashTag = matchMasterValues[i_matchMasterValues][5];
      var isDynamicPricing = matchMasterValues[i_matchMasterValues][6];
      var isResaleTicketAvailable = matchMasterValues[i_matchMasterValues][7];
      var onSaleDate = matchMasterValues[i_matchMasterValues][8];
      var dateNow = new Date();

      // -----BEGIN IF isDynamicPricing-----
      if (dateNow > onSaleDate && isDynamicPricing) { // 発売日以降かつダイナミックプライシング適用試合の場合
        // -----BEGIN SCRAPING-----
        var html_JLeagueTicket = UrlFetchApp.fetch(ticketUrl).getContentText();
        // Parser: from().to()はfromとtoに挟まれた部分を抜き出します。build()で文字列、iterate()で文字列の配列が得られます。

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

        // 席種・価格
        var seat = [];
        var price = [];

        var doc_seatlist = Parser.data(html_JLeagueTicket)
          .from('<div class="seat-select-list-txt">')
          .to('</div>')
          .iterate();

        var doc_seatlist_is_vacant = Parser.data(html_JLeagueTicket)
          .from('<div class="seat-select-list-img ')
          .to('">')
          .iterate();

        for (var i_doc_seatlist = 0; i_doc_seatlist < doc_seatlist.length; i_doc_seatlist++) {
          if (doc_seatlist_is_vacant[i_doc_seatlist] !== 'bg-no' && doc_seatlist_is_vacant[i_doc_seatlist] !== 'bg-pre') { // 空きある場合のみ取得
            var seat_tmp = Parser.data(doc_seatlist[i_doc_seatlist])
              .from('<h4>')
              .to('</h4>')
              .build();
            seat.push(seat_tmp);

            var price_tmp = Parser.data(doc_seatlist[i_doc_seatlist])
              .from('<p>')
              .to('円/枚</p>')
              .build();

            if (price_tmp.indexOf("～") == -1) {
              price.push(price_tmp);
            } else {
              price.push(price_tmp.slice(price_tmp.indexOf("～") + 1, price_tmp.length)); // 数字のみ取得
            }
          }
        }
        // -----END SCRAPING-----

        // -----BEGIN SHEET OPERATION-----
        // 出力先シート作成
        var seatPriceSheet = SpreadsheetApp.getActive().getSheetByName('SeatPrice_' + matchId + '_' + cupTitle + '_' + homeTeam + 'v' + awayTeam);
        if (seatPriceSheet === null) {
          var seatPriceSheet_org = SpreadsheetApp.getActive().getSheetByName('SeatPriceMaster');
          seatPriceSheet_org.activate();
          SpreadsheetApp.getActive().duplicateActiveSheet().setName('SeatPrice_' + matchId + '_' + cupTitle + '_' + homeTeam + 'v' + awayTeam);
          seatPriceSheet = SpreadsheetApp.getActive().getSheetByName('SeatPrice_' + matchId + '_' + cupTitle + '_' + homeTeam + 'v' + awayTeam);
        }

        // 出力開始
        var lastRow_seatPriceSheet = seatPriceSheet.getLastRow();
        var lastCol_seatPriceSheet = seatPriceSheet.getLastColumn();
        seatPriceSheet.getRange(lastRow_seatPriceSheet + 1, 1).setValue(new Date());

        // 定義済みの席種の一致を確認し、数値挿入
        for (var i_seat = 0; i_seat < seat.length; i_seat++) {
          for (var i_lastCol_seatPriceSheet = 2; i_lastCol_seatPriceSheet <= lastCol_seatPriceSheet; i_lastCol_seatPriceSheet++) {
            if (seatPriceSheet.getRange(1, i_lastCol_seatPriceSheet).getValue() == seat[i_seat]) {
              seatPriceSheet.getRange(lastRow_seatPriceSheet + 1, i_lastCol_seatPriceSheet).setValue(price[i_seat]);
            }
          }
        }
        var data = seatPriceSheet.getRange(1, 1, seatPriceSheet.getLastRow(), seatPriceSheet.getLastColumn()).getValues();
        // -----END SHEET OPERATION-----

        // -----BEGIN TWEET-----
        var status_txt = '🎫ダイナミックプライシングチケット' +
          '\n' + cupTitle +
          '\n' + homeTeamHashTag + ' vs ' + awayTeamHashTag +
          '\n' + gameDate + ' @ ' + stadium +
          '\n' + ticketUrlBitly +
          '\n(' + formatDate(new Date(), 'yyyy/MM/dd') + '時点)';
        status_txt = status_txt.substr(0, 140) // 140文字制限

        // -----Tweet Summary-----
        var status_txt_forSummary_array = [];
        status_txt_forSummary_array.push('席種 / 最新 / 平均\n');

        for (var i_data_forSummary_col = 1; i_data_forSummary_col < data[0].length; i_data_forSummary_col++) {
          var tmp_data_forSummary_sum = 0;
          var tmp_data_forSummary_numOfElements = 0;
          var tmp_data_forSummary_avg = 0;
          var tmp_data_forSummary_latest;
          var tmp_data_forSummary_seatSummary;
          var status_txt_forSummary_array_tmp;

          for (var i_data_forSummary_row = 1; i_data_forSummary_row < data.length; i_data_forSummary_row++) {
            if (data[i_data_forSummary_row][i_data_forSummary_col]) {
              tmp_data_forSummary_sum += data[i_data_forSummary_row][i_data_forSummary_col];
              tmp_data_forSummary_numOfElements++;
            }
          }

          tmp_data_forSummary_avg = Math.round(tmp_data_forSummary_sum / tmp_data_forSummary_numOfElements);
          tmp_data_forSummary_latest = data[data.length - 1][i_data_forSummary_col] ? data[data.length - 1][i_data_forSummary_col] : '-';
          tmp_data_forSummary_seatSummary = data[0][i_data_forSummary_col] + ' / ' + tmp_data_forSummary_latest + ' / ' + tmp_data_forSummary_avg + '\n';

          // 140文字制限への対処
          status_txt_forSummary_array_tmp = status_txt_forSummary_array[status_txt_forSummary_array.length - 1];
          status_txt_forSummary_array_tmp += tmp_data_forSummary_seatSummary;
          if (status_txt_forSummary_array_tmp.length < 140) { // 140文字以内なら配列入れ替え
            status_txt_forSummary_array.pop();
            status_txt_forSummary_array.push(status_txt_forSummary_array_tmp);
          } else { // 140文字以上なら新規要素としてpush
            status_txt_forSummary_array.push(tmp_data_forSummary_seatSummary);
          }
        }


        // リプライ形式でtweet
        var last_tweet = post_tweet_v2(status_txt, null); // status_txtをtweet

        // status_txt_forSummary_arrayをtweet
        for (var i_status_txt_forSummary_array = 0; i_status_txt_forSummary_array < status_txt_forSummary_array.length; i_status_txt_forSummary_array++) {
          last_tweet = post_tweet_v2(status_txt_forSummary_array[i_status_txt_forSummary_array], last_tweet.data.id);
        }

        // -----END TWEET-----
      }
      // -----END IF isDynamicPricing-----

    } catch (e) {
      Logger.log('[Error] ' + e);
    }
  }
  // -----END MatchMaster-----
}
