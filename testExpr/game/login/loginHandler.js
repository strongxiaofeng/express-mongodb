var server = require("./loginServer");
var wss = require("../../socket/websocket");
var commands = require("../../socket/commands");

exports.handMsg = function (ws, data) {
    var command = data.command;
    switch (command){
        case commands.REGISTER:
            handleRegister(ws, data);
            break;
        case commands.LOGIN:
            handleLogin(ws, data);
            break;
        case commands.WS_CLOSE:
            handleClose(ws.name);
            break;
    }
}
function handleClose(name) {
    server.userExit(name);
}
function handleRegister(ws, data) {
    var sqs = data.sequence;
    server.register(data.content.name, data.content.password, function (errcode, result) {
        if(errcode){
            console.log("注册错误 "+errcode);
            var resp = {command:commands.REGISTER, code:errcode, sequence:sqs};
            wss.sendMsg(ws, resp);
        }
        else{
            //注册成功
            var resp = {command:commands.REGISTER, code:0, sequence:sqs};
            wss.sendMsg(ws, resp);
        }
    });
}
function handleLogin(ws, data) {
    var sqs = data.sequence;
    server.login(data.content.name, data.content.password, function (errcode, result) {
        if(errcode){
            console.log("登录错误 "+errcode);
            var resp = {command:commands.LOGIN, code:errcode, sequence:sqs};
            wss.sendMsg(ws, resp);
        }
        else{
            if(result){
                //登录成功就把name和这个ws关联起来
                ws.name = data.content.name;
                var resp = {command:commands.LOGIN, code:0, sequence:sqs, content:{name:data.content.name}};
                wss.sendMsg(ws, resp);
            }
        }
    })
}
