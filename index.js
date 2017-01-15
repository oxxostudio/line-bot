var linebot = require('linebot');
var express = require('express');
var getJSON = require('get-json');
var request = require("request");
var cheerio = require("cheerio");

var bot = linebot({
  channelId: '1496768068',
  channelSecret: 'a2250f5dd66b98f29b56f6967e0cae11',
  channelAccessToken: 'FjXhBnfpEGVOtDrR/hPjw7l0y3Vaq9Y7rV4eY5ydSwlB5W6iPy9wflTjyd+Ts7TP9XTsv7Lzluc6GPDotXQrc6VXw55J0+iAwFQokhtfEp6Y33y+XrVrL94BZCJ2bfUWORQxmlrsneRHpb93XECoFAdB04t89/1O/w1cDnyilFU='
});

var timer, timer2, jp;
var pm = [];

_getJSON();
_bot();
_japan();

const app = express();
const linebotParser = bot.parser();
app.post('/', linebotParser);

//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
var server = app.listen(process.env.PORT || 8080, function() {
  var port = server.address().port;
  console.log("App now running on port", port);
});

function _bot() {
  bot.on('message', function(event) {
    if (event.message.type == 'text') {
      var msg = event.message.text;
      var replyMsg = '';
      if (msg.indexOf('PM2.5') != -1) {
        pm.forEach(function(e, i) {
          if (msg.indexOf(e[0]) != -1) {
            replyMsg = e[0] + '的 PM2.5 數值為 ' + e[1];
          }
        });
        if (replyMsg == '') {
          replyMsg = '請輸入正確的地點';
        }
      } else if (msg.indexOf('日幣') != -1) {
        replyMsg = jp;
      }
      if (replyMsg == '') {
        replyMsg = '不知道「' + msg + '」是什麼意思 :p';
      }

      event.reply(replyMsg).then(function(data) {
        console.log(replyMsg);
      }).catch(function(error) {
        console.log('error');
      });
    }
  });

}

function _getJSON() {
  clearTimeout(timer);
  getJSON('http://opendata2.epa.gov.tw/AQX.json', function(error, response) {
    response.forEach(function(e, i) {
      pm[i] = [];
      pm[i][0] = e.SiteName;
      pm[i][1] = e['PM2.5'] * 1;
      pm[i][2] = e.PM10 * 1;
    });
  });
  timer = setInterval(_getJSON, 1800000); //每半小時抓取一次新資料
}

function _japan() {
  clearTimeout(timer2);
  request({
    url: "http://rate.bot.com.tw/Pages/Static/UIP003.zh-TW.htm",
    method: "GET"
  }, function(error, response, body) {
    if (error || !body) {
      return;
    } else {
      var $ = cheerio.load(body);
      var target = $(".rate-content-sight.text-right.print_hide");
      console.log(target[15].children[0].data);
      jp = target[15].children[0].data;
      // if (jp < 0.28) {
      //   bot.push('U83132b951316aa0a50d8003b1f638055', '現在日幣 ' + jp + '，該買啦！');
      // }
      timer2 = setInterval(_japan, 120000);
    }
  });
}
