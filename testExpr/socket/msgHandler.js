var commands = require("./commands");
var loginHandler = require("../game/login/loginHandler");
var gameHandler = require("../game/game/gameHandler");
var events = require('events');
var emitter = new events.EventEmitter();

addEvents();

function addEvents() {
    addEvent(commands.REGISTER, loginHandler);
    addEvent(commands.LOGIN, loginHandler);
    addEvent(commands.WS_CLOSE, loginHandler);
    addEvent(commands.MATCH_PLAYER, gameHandler);
    addEvent(commands.PLAY_GAME, gameHandler);
    addEvent(commands.WS_CLOSE, gameHandler);
}
function addEvent(command, handler) {
    emitter.on(command, function (ws, data) {
        handler.handMsg(ws, data);
    })
}

exports.dispatch = function (command, ws, data) {
    emitter.emit(command, ws, data);
}

