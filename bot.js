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
  click = spawner("/opt/click");
  notifyWS('opened', reply);
  reply("The doors are opened!");
  click.on('close', function() {
    reply("The doors are closed!");
    notifyWS('closed', reply);
  });
};
var notifyWS = function(msg, reply) {
  if (damian !== null) {
    try {
      damian.send(msg);
      console.log("Notified with " + msg);
    } catch (e) {
      reply("Error" + e);
      console.log(e);
    }
  } else {
    reply("Android device is off!");
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

controller.hears(['photo'], 'direct_mention,mention', function(
  bot, message) {
  var reply = function(msg) {
    bot.reply(message, msg);
  };
  notifyWS('photo', reply);
});
controller.hears(['open'], 'direct_mention,mention', function(
  bot, message) {
  var reply = function(msg) {
    bot.reply(message, msg);
  };
  openDoors(reply);
});
