var Botkit = require('./lib/Botkit.js'),
  os = require('os'),
  WebSocketServer = require('ws').Server,
  wss = new WebSocketServer({
    port: 9988
  }),
  spawner = require('child_process').spawn;
var damian;
wss.on('connection', function(ws) {
  damian = ws;
});

var controller = Botkit.slackbot({
  debug: false,
});

var bot = controller.spawn({
  token: process.env.token
}).startRTM();

var openDoors = function(reply) {
  click = spawner("/opt/click");
  reply("The doors are opened!");
  click.on('close', function() {
    reply("The door are closed!");
  });
};
controller.hears(['hello', 'hi'],
  'direct_message,direct_mention,mention',
  function(bot, message) {
    controller.storage.users.get(message.user, function(err, user) {
      if (user && user.name) {
        bot.reply(message, "Hello " + user.name + "!!");
      } else {
        bot.reply(message, "Hello.");
      }
    });
  });

controller.hears(['photo'], 'direct_message,direct_mention,mention', function(
  bot, message) {
  if (damian !== null) {
    damian.send('photo');
  }
});
controller.hears(['open'], 'direct_message,direct_mention,mention', function(
  bot, message) {
  openDoors(function(msg) {
    bot.reply(message, msg);
  });
});
