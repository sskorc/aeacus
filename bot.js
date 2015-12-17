var Botkit = require('./lib/Botkit.js'),
  os = require('os'),
  WebSocketServer = require('ws').Server,
  wss = new WebSocketServer({
    port: 9988
  }),
  spawner = require('child_process').spawn;
var damian = null;
wss.on('connection', function(ws) {
  damian = ws;
  console.log("new connection");
  ws.on('close', function() {
    damian = null;
    console.log("Android device lost connection!");
  });
});

var controller = Botkit.slackbot({
  debug: false,
});

var bot = controller.spawn({
  token: process.env.token
}).startRTM();

var openDoors = function(reply) {
  var click = spawner("/opt/click"),
    isWSOn = notifyWS('opened', reply);
  reply("The doors are opened!");
  click.on('close', function() {
    reply("The doors are closed!");
    if (isWSOn)
      notifyWS('closed', reply);
  });
};
var notifyWS = function(msg, reply) {
  if (damian !== null) {
    try {
      damian.send(msg);
      console.log("Notified with " + msg);
      return true;
    } catch (e) {
      reply("Error" + e);
      console.log(e);
      return false;
    }
  } else {
    reply("Android device is off!");
    return false;
  }
};

controller.hears(['hello', 'hi'], 'direct_mention,mention',
  function(bot, message) {
    controller.storage.users.get(message.user, function(err, user) {
      if (user && user.name) {
        bot.reply(message, "Hello " + user.name + "!!");
      } else {
        bot.reply(message, "Hello.");
      }
    });
  });

controller.hears(['photo', 'deny'], 'direct_mention,mention', function(
  bot, message) {
  var reply = function(msg) {
    bot.reply(message, msg);
  };
  notifyWS(message.text, reply);
});

controller.hears(['open'], 'direct_mention,mention', function(
  bot, message) {
  var reply = function(msg) {
    bot.reply(message, msg);
  };
  openDoors(reply);
});
