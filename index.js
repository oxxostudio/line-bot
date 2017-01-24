var linebot = require('linebot');
var express = require('express');
var getJSON = require('get-json');
var request = require("request");
var cheerio = require("cheerio");
var httpp = require("http");
require("webduino-js");
require("webduino-blockly");

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
var userId;

var deviceId = '10RrGGer';
var rgbled;

var words = [{
  "name": "pm25",
  "content": ['pm2.5', 'pm25','pm 2.5','aqi', '空氣污染', '空污', '空汙', '空氣品質', 'pm10', 'pm 10']
}, {
  "name": "pm25Location",
  "content": ['空氣監測站']
}, {
  "name": "japan",
  "content": ['日幣', '日圓', '日元']
}, {
  "name": "color",
  "content": ['紅色', '藍色', '綠色', '黃色', '關燈', '開燈', 'red', 'blue', 'yellow', 'green', 'turn on', 'turn off']
}, {
  "name": "device",
  "content": ['裝置id:', '裝置 id:', 'device id:', 'deviceid:']
}, {
  "name": "online",
  "content": ['裝置連線']
}, {
  "name": "talk1",
  "content": ['妳好', '你好', '哈囉', 'hi', 'hello', '您好', '嗨', '好久不見']
}, {
  "name": "talk2",
  "content": ['早安', '午安', '晚安', '再見', '掰掰', 'bye', 'morning', 'night']
}];
var a0 = 0;

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
    userId = event.source.userId;
    if (event.message.type == 'text') {
      var msg = event.message.text.toLowerCase();
      replyMsg = '';
      a0 = 0;
      words.forEach(function(row) {
        row.content.forEach(function(col) {
          if (msg.indexOf(col) != -1) {
            a0 = 1;
            if (row.name == 'pm25' || row.name == 'pm25Location') {
              bot.push(userId, '資料查詢中...');
              _pm25(msg);
            } else if (row.name == 'japan') {
              bot.push(userId, '資料查詢中...');
              _japan();
            } else if (row.name == 'device') {
              _deviceId(msg);
            } else if (row.name == 'color') {
              _webduino(msg);
            } else if (row.name == 'online') {
              _webduinoOnline();
            } else if (row.name == 'talk1') {
              _talk1();
            } else if (row.name == 'talk2') {
              _talk2(msg);
            }
          }
        });
      });

      if (a0 == 0) {
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
    }
  });
}

function _deviceId(msg) {
  var d = msg.split(':')[1];
  if (d) {
    deviceId = d;
  }
  replyMsg = '新的 Device ID [ ' + d + ' ] 設定完成';
  botEvent.reply(replyMsg).then(function(data) {
    console.log(replyMsg);
  }).catch(function(error) {
    console.log('error');
  });
}

function _webduinoOnline() {
  boardReady({
    board: 'Smart',
    device: deviceId,
    transport: 'mqtt'
  }, function(board) {
    board.systemReset();
    board.samplingInterval = 50;
    rgbled = getRGBLedCathode(board, 15, 12, 13);
    replyMsg = '裝置已上線 ( ' + deviceId + ' )';
    botEvent.reply(replyMsg).then(function(data) {
      console.log(replyMsg);
    }).catch(function(error) {
      console.log('error');
    });
  });
}

function _webduino(msg) {
  if (msg.indexOf('黃色') != -1||msg.indexOf('yellow') != -1) {
    rgbled.setColor('#ffff00');
    replyMsg = '已經發出黃色光';
  } else if (msg.indexOf('紅色') != -1||msg.indexOf('red') != -1) {
    rgbled.setColor('#ff0000');
    replyMsg = '已經發出紅色光...';
  } else if (msg.indexOf('綠色') != -1||msg.indexOf('green') != -1) {
    rgbled.setColor('#00ff00');
    replyMsg = '已經發出綠色光';
  } else if (msg.indexOf('藍色') != -1||msg.indexOf('blue') != -1) {
    rgbled.setColor('#0000ff');
    replyMsg = '已經發出藍色光';
  } else if (msg.indexOf('開燈') != -1||msg.indexOf('turn on') != -1) {
    rgbled.setColor('#ffffff');
    replyMsg = '開燈囉！';
  } else if (msg.indexOf('關燈') != -1||msg.indexOf('turn off') != -1) {
    rgbled.setColor('#000000');
    replyMsg = '關起來了！';
  }
  botEvent.reply(replyMsg).then(function(data) {
    console.log(replyMsg);
  }).catch(function(error) {
    console.log('error');
  });
}



var all1 = ['你好，', '您好，', '哈囉，', 'Hi~', 'Hello~', '嗨嗨，'];
var all2 = ['請問有事嗎？', '有什麼我可以服務的嗎？', '有事找我嗎？', '有什麼事嗎？', '需要我幫忙什麼嗎？', '想聊聊嗎？'];

function _talk1() {

  var reply1 = all1;
  var reply2 = all2;
  var r1 = Math.floor(Math.random() * (reply1.length));
  var r2 = Math.floor(Math.random() * (reply2.length));

  replyMsg = reply1[r1] + reply2[r2];

  botEvent.reply(replyMsg).then(function(data) {
    console.log(replyMsg);
  }).catch(function(error) {
    console.log('error');
  });
}

function _talk2(msg) {
  var reply1 = all1;
  var reply2 = all2;
  if (msg.indexOf('早安') != -1) {
    reply1 = reply1.concat(['早安，', '早安呦！', '早安您好，', '早上好，']);
  } else if (msg.indexOf('午安') != -1) {
    reply1 = reply1.concat(['午安，', '午安您好，', '午安呦！']);
  } else if (msg.indexOf('晚安') != -1) {
    reply1 = reply1.concat(['晚安，', '晚安您好，', '晚安呦！']);
  } else if (msg.indexOf('再見') != -1 || msg.indexOf('掰掰') != -1 || msg.indexOf('bye') != -1) {
    reply1 = ['再見囉！', '再會啦！', 'Bye~', '掰掰！'];
    reply2 = ['有事再找我喔！', '祝你一切順心~', '有問題再找我~ ^_^', '有空再聊~'];
  }

  var r1 = Math.floor(Math.random() * (reply1.length));
  var r2 = Math.floor(Math.random() * (reply2.length));
  replyMsg = reply1[r1] + reply2[r2];

  botEvent.reply(replyMsg).then(function(data) {
    console.log(replyMsg);
  }).catch(function(error) {
    console.log('error');
  });
}

function _preventSleeping() {
  clearTimeout(timer);
  httpp.get('http://oxxolinebot.herokuapp.com/');
  console.log('awake');
  timer = setInterval(_preventSleeping, 300000);
}
