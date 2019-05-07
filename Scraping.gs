function scrapingTrigger() {
  var matchMasterSheet = SpreadsheetApp.getActive().getSheetByName('MatchMaster');
  var matchMasterValues = matchMasterSheet.getRange(2, 1, matchMasterSheet.getLastRow(), matchMasterSheet.getLastColumn()).getValues();
  Logger.log(matchMasterValues);

  // -----試合毎にScraping実施-----
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

      // -----Scraping-----
      var html = UrlFetchApp.fetch(ticketUrl).getContentText();
      // Parser: from().to()はfromとtoに挟まれた部分を抜き出します。build()で文字列、iterate()で文字列の配列が得られます。

      // GameInfo情報取得
      // 試合日・スタジアム
      var doc_date = Parser.data(html)
        .from('<span class="day">')
        .to('</span>')
        .iterate();
      var gameDate = doc_date[0] + ' ' + doc_date[1];

      var doc_stadium_div = Parser.data(html)
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

      var doc_seatlist = Parser.data(html)
        .from('<div class="seat-select-list-txt">')
        .to('</div>')
        .iterate();

      var doc_seatlist_is_vacant = Parser.data(html)
        .from('<div class="seat-select-list-img ')
        .to('">')
        .iterate();

      for (var i_doc_seatlist = 0; i_doc_seatlist < doc_seatlist.length; i_doc_seatlist++) {
        if (doc_seatlist_is_vacant[i_doc_seatlist] !== 'bg-no') { // 空きある場合のみ取得
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


      // -----シート操作-----
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

      // -----Chart作成-----
      var data = seatPriceSheet.getRange(1, 1, seatPriceSheet.getLastRow(), seatPriceSheet.getLastColumn()).getValues();
      // Build data table
      var dataTable = Charts.newDataTable();
      // Add Column types
      dataTable.addColumn(Charts.ColumnType.DATE, data[0][0]);
      for (var i_data = 1; i_data < data[0].length; i_data++) {
        dataTable.addColumn(Charts.ColumnType.NUMBER, data[0][i_data]);
      }

      // Add rows
      for (var j_data = 1; j_data < data.length; j_data++) {
        dataTable.addRow(data[j_data]);
        Logger.log(data[j_data])
      }
      var chartBuilder = Charts.newLineChart()
        .setTitle(cupTitle + ' ' + homeTeam + ' v ' + awayTeam)
        .setXAxisTitle('Date')
        .setYAxisTitle('Price (JPY)')
        .setDimensions(2560, 1440)
        .setPointStyle(Charts.PointStyle.MEDIUM)
        .setOption('vAxis.logScale', true)
        .setOption('vAxis.gridlines.count', -1)
        .setOption('hAxis.gridlines.count', -1)
        .setDataTable(dataTable);
      var chart = chartBuilder.build().getBlob();

      var status_txt = '【ダイナミックプライシングチケット価格】' +
        '\n' + cupTitle + ' ' + homeTeam + ' v ' + awayTeam +
        '\n' + gameDate + ' @ ' + stadium +
        '\n' + ticketUrlBitly +
        '\n(' + formatDate(new Date(), 'yyyy/MM/dd') + '時点)' +
        '\n\n' + homeTeamHashTag + ' ' + awayTeamHashTag;
      status_txt = status_txt.substr(0, 140) // 140文字制限

      tweetWithMedia(chart, status_txt);
      Logger.log('Tweet Done:\n' + status_txt);

      /// -----For debug-----
      /*
      MailApp.sendEmail({
        to: PropertiesService.getScriptProperties().getProperty("MAIL_TO"),
        subject: 'GAS Chart',
        htmlBody: status_txt + '<br/><img src="cid:sampleCharts">',
        inlineImages: {
          sampleCharts: chart
        }
      });
      */
      

    } catch (e) {
      Logger.log('[Error] ' + e);
    }
  }
}
