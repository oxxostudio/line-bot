var linebot = require('linebot');
var express = require('express');

var bot = linebot({
  channelId: '1496318741',
  channelSecret: '278008fc02f08dfd8f92cd8473c82a70',
  channelAccessToken: 'uwKsnp+a4OtalGrxR35JAx+TXi6MQeGaVV8e0xGpW2g+xOODaoCo1RGIMKw1LwZyoIzifdM8c3HUPmQRgCHvn4NCv6+jRsSKH4Ff8OK6o419JJoheHbtHaUkCqjl3yivFkpHsvs9dDCCNLJ8NkVTfgdB04t89/1O/w1cDnyilFU='
});

bot.on('message', function(event) {
  console.log(event); //把收到訊息的 event 印出來看看
});

const app = express();
const linebotParser = bot.parser();
app.post('/', linebotParser);

//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
var server = app.listen(process.env.PORT || 8080, function() {
  var port = server.address().port;
  console.log("App now running on port", port);
});