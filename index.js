var linebot = require('linebot');
var express = require('express');
var getJSON = require('get-json');
var request = require("request");
var cheerio = require("cheerio");
var httpp = require("http");

var bot = linebot({
  channelId: '1496768068',
  channelSecret: 'a2250f5dd66b98f29b56f6967e0cae11',
  channelAccessToken: 'FjXhBnfpEGVOtDrR/hPjw7l0y3Vaq9Y7rV4eY5ydSwlB5W6iPy9wflTjyd+Ts7TP9XTsv7Lzluc6GPDotXQrc6VXw55J0+iAwFQokhtfEp6Y33y+XrVrL94BZCJ2bfUWORQxmlrsneRHpb93XECoFAdB04t89/1O/w1cDnyilFU='
});

var timer;
var jp;
var pm = [];
var botEvent;
var replyMsg;
var words = [
  ['pm2.5', 'PM2.5', 'PM25', 'pm25', '空氣污染', '空汙', '空氣品質', 'PM10', 'pm10'],
  ['空氣監測站'],
  ['日幣', '日圓', '日元']
];
var a0 = 0;
var a1 = -1;
var a2 = -1;

_bot();
_preventSleeping();

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
    botEvent = event;
    if (event.message.type == 'text') {
      var msg = event.message.text;
      replyMsg = '';

      words.forEach(function(row) {
        a1 = a1 + 1;
        row.forEach(function(col) {
          a2 = a2 + 1;
          if (msg.indexOf(col) != -1) {
            a0 = 1;
            if (a1 == 0 || a1 == 1) {
              _pm25(msg);
            } else if (a1 == 2) {
              _japan();
            }
          }
        });
      });

      if (a0 == 0) {
        a1 = -1;
        a2 = -1;
        replyMsg = '不知道「' + msg + '」是什麼意思 :p';
        event.reply(replyMsg).then(function(data) {
          console.log(replyMsg);
        }).catch(function(error) {
          console.log('error');
        });
      }
    }
  });

}

function _pm25(msg) {
  //http://taqm.epa.gov.tw/taqm/aqs.ashx?lang=tw&act=aqi-epa
  //http://opendata2.epa.gov.tw/AQX.json
  getJSON('http://taqm.epa.gov.tw/taqm/aqs.ashx?lang=tw&act=aqi-epa', function(error, response) {
    var location = '';
    var aqi;
    response.Data.forEach(function(e, i) {
      pm[i] = [];
      pm[i][0] = e.SiteName;
      pm[i][1] = e.AQI * 1;
      pm[i][2] = e.PM25 * 1;
      pm[i][3] = e.PM10 * 1;
      if (i < (response.Data.length - 1)) {
        location = location + pm[i][0] + ' , ';
      } else {
        location = location + pm[i][0];
      }
    });
    if (msg.indexOf('空氣監測站') != -1) {
      replyMsg = location;
    } else {
      pm.forEach(function(e) {
        if (msg.indexOf(e[0]) != -1) {
          if (e[1] < 51) {
            aqi = '良好';
          } else if (e[1] >= 51 && e[1] < 101) {
            aqi = '普通';
          } else if (e[1] >= 101 && e[1] < 151) {
            aqi = '不健康';
          } else if (e[1] >= 151 && e[1] < 201) {
            aqi = '很不健康';
          } else {
            aqi = '危害';
          }
          replyMsg = e[0] + '的空氣品質「' + aqi + '」( AQI = ' + e[1] + '，PM2.5 = ' + e[2] + '，PM10 = ' + e[3] + ' )';
        }
      });
    }
    if (replyMsg == '') {
      replyMsg = '請輸入正確的地點，或輸入「空氣監測站」查詢地點';
    }
    botEvent.reply(replyMsg).then(function(data) {
      console.log(replyMsg);
    }).catch(function(error) {
      console.log('error');
    });
    a0 = 0;
    a1 = -1;
    a2 = -1;
  });
}

function _japan() {
  request({
    url: "http://rate.bot.com.tw/Pages/Static/UIP003.zh-TW.htm",
    method: "GET"
  }, function(error, response, body) {
    if (error || !body) {
      return;
    } else {
      var $ = cheerio.load(body);
      var target = $(".rate-content-cash.text-right.print_hide");
      replyMsg = target[15].children[0].data;
      botEvent.reply(replyMsg).then(function(data) {
        console.log(replyMsg);
      }).catch(function(error) {
        console.log('error');
      });
      a0 = 0;
      a1 = -1;
      a2 = -1;
    }
  });
}

function _preventSleeping() {
  clearTimeout(timer);
  httpp.get('http://oxxolinebot.herokuapp.com/');
  console.log('awake');
  timer = setInterval(_preventSleeping, 300000);
}
