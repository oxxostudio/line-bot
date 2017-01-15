var linebot = require('linebot');
var express = require('express');

var bot = linebot({
  channelId: '1496768068',
  channelSecret: 'a2250f5dd66b98f29b56f6967e0cae11',
  channelAccessToken: 'FjXhBnfpEGVOtDrR/hPjw7l0y3Vaq9Y7rV4eY5ydSwlB5W6iPy9wflTjyd+Ts7TP9XTsv7Lzluc6GPDotXQrc6VXw55J0+iAwFQokhtfEp6Y33y+XrVrL94BZCJ2bfUWORQxmlrsneRHpb93XECoFAdB04t89/1O/w1cDnyilFU='
});

bot.on('message', function(event) {
  if (event.message.type = 'text') {
    var msg = event.message.text;
    event.reply(msg).then(function(data) {
      // success 
      console.log(msg);
    }).catch(function(error) {
      // error 
      console.log('error');
    });
  }
});

const app = express();
const linebotParser = bot.parser();
app.post('/', linebotParser);

//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
var server = app.listen(process.env.PORT || 8080, function() {
  var port = server.address().port;
  console.log("App now running on port", port);
});
