var cardUtil = require("./cardUtil");
var wss = require("../../socket/websocket");
var commands = require("../../socket/commands");
var codes = require("../errorCode");

/**
 * 单个房间服务
 * */
var RoomServer = function () {
}
var p = RoomServer.prototype;
p.roomId = parseInt(Math.random()*100000000);
/**4个玩家*/
p.players = [];
/**牌组*/
p.leftCards = [];
/**发牌间隔*/
p.dealCardTime = 300;

/**玩家0的牌*/
p.cards0 = [];
/**玩家1的牌*/
p.cards1 = [];
/**玩家2的牌*/
p.cards2 = [];
/**玩家3的牌*/
p.cards3 = [];
/**玩家0的摆出来的牌*/
p.showedCards0 = [];
/**玩家1的摆出来的牌*/
p.showedCards1 = [];
/**玩家2的摆出来的牌*/
p.showedCards2 = [];
/**玩家3的摆出来的牌*/
p.showedCards3 = [];
/**玩家0的打过的牌*/
p.playedCards0 = [];
/**玩家1的打过的牌*/
p.playedCards1 = [];
/**玩家2的打过的牌*/
p.playedCards2 = [];
/**玩家3的打过的牌*/
p.playedCards3 = [];
/**玩家0的定缺*/
p.lackCard0 = "";
/**玩家1的定缺*/
p.lackCard1 = "";
/**玩家2的定缺*/
p.lackCard2 = "";
/**玩家3的定缺*/
p.lackCard3 = "";
/**当前出牌的人 默认0*/
p.curPlayIndex = 0;
/**当前出的牌*/
p.curPlayedCard = -1;

/**当前房间状态 01234*/
p.state = 0;
/**发牌*/
p.STATE_DEALCARD = 0;
/**定缺*/
p.STATE_LACKCARD = 1;
/**出牌*/
p.STATE_PLAYCARD = 2;
/**碰/杠/胡/过 牌*/
p.STATE_HANDLECARD = 3;
/**结算*/
p.STATE_PAYOUT = 4;
/**
 * 在STATE_HANDLECARD的状态时，等待胡/杠/碰的队列，以座位号为key，操作为value
 * 有可能这个状态时有多个人都可以对当前出的牌有想法 他们有的想胡牌，有的想碰/杠，以胡牌的优先级最高 所以要写一个队列
 * 例如 玩家0出了牌，这个队列可能是{1:"peng,gang", 2:"hu", 3:"hu"}
 * */
p.waitQueue = {};
/**
 * 向玩家发送的状态码
 * 通知骰子点数和庄家
*  通知摸牌（通知自己和其他人）
*  通知定缺
*  通知所有玩家 当前的出牌人
*  通知单个玩家可以操作 胡/杠/碰/出牌
*  通知某个玩家出了什么牌，他一共出过哪些牌
*  通知某个玩家胡了什么牌
*  通知某个玩家杠了什么牌, 他摆出来的所有牌
*  通知某个玩家碰了什么牌, 他摆出来的所有牌
*  通知所有玩家 游戏结束
 * */
p.roomCommand_dice = 1;
p.roomCommand_dealCard = 2;
p.roomCommand_lackCard = 3;
p.roomCommand_curPlayIndex = 4;
p.roomCommand_handleCard = 5;
p.roomCommand_playedCard = 6;
p.roomCommand_huCard = 7;
p.roomCommand_gangCard = 8;
p.roomCommand_pengCard = 9;
p.roomCommand_gameOver = 10;

/**玩家发送给服务端的操作码 定缺，出牌， 碰, 杠, 胡, 过*/
p.playCommand_lackCard = 1;
p.playCommand_playCard = 2;
p.playCommand_pengCard = 3;
p.playCommand_gangCard = 4;
p.playCommand_huCard = 5;
p.playCommand_guoCard = 6;

/**是否胡牌*/
p.isPlayerHu0 = false;
p.isPlayerHu1 = false;
p.isPlayerHu2 = false;
p.isPlayerHu3 = false;

/**设置玩家*/
p.setPlayers = function (players) {
    this.players = players;
}
/**初始游戏*/
p.initGame = function () {
    this.leftCards = cardUtil.getNewCards108();

    var self = this;
    this.initDealCard(0 , 4, 0);
    this.initDealCard(1 , 4, 1);
    this.initDealCard(2 , 4, 2);
    this.initDealCard(3 , 4, 3);
    this.initDealCard(0 , 4, 4);
    this.initDealCard(1 , 4, 5);
    this.initDealCard(2 , 4, 6);
    this.initDealCard(3 , 4, 7);
    this.initDealCard(0 , 4, 8);
    this.initDealCard(1 , 4, 9);
    this.initDealCard(2 , 4, 10);
    this.initDealCard(3 , 4, 11);
    this.initDealCard(0 , 2, 12);
    this.initDealCard(1 , 1, 13);
    this.initDealCard(2 , 1, 14);
    this.initDealCard(3 , 1, 15, function () {
        self.changeState(self.STATE_LACKCARD);
    });
}

/**初始发牌*/
p.initDealCard = function (i,num,delay, callback) {
    var self = this;
    setTimeout(function () {
        self.dealCard(i, self.getCard(num));
        if(callback){
            callback.call(self);
        }
    },self.dealCardTime*delay);
}
/**向某个玩家发牌*/
p.dealCard = function (i, arr) {
    this.changeState(this.STATE_DEALCARD);
    this["cards"+i] = this["cards"+i].concat(arr);
    this.sendToOneRoomPlayer(i, {command:commands.ROOM_NOTIFY, content:{roomId:this.roomId, state:this.roomCommand_dealCard,addCards:arr, leftCardsNum:this.leftCards.length}});
    //发一个人的牌时要告知另外三个人，这个人的牌数变了
    if(i != 0)this.sendToOneRoomPlayer(0, {command:commands.ROOM_NOTIFY, content:{roomId:this.roomId, state:this.roomCommand_dealCard,otherCardNum:{index:i,num:this["cards"+i].length}, leftCardsNum:this.leftCards.length}});
    if(i != 1)this.sendToOneRoomPlayer(1, {command:commands.ROOM_NOTIFY, content:{roomId:this.roomId, state:this.roomCommand_dealCard,otherCardNum:{index:i,num:this["cards"+i].length}, leftCardsNum:this.leftCards.length}});
    if(i != 2)this.sendToOneRoomPlayer(2, {command:commands.ROOM_NOTIFY, content:{roomId:this.roomId, state:this.roomCommand_dealCard,otherCardNum:{index:i,num:this["cards"+i].length}, leftCardsNum:this.leftCards.length}});
    if(i != 3)this.sendToOneRoomPlayer(3, {command:commands.ROOM_NOTIFY, content:{roomId:this.roomId, state:this.roomCommand_dealCard,otherCardNum:{index:i,num:this["cards"+i].length}, leftCardsNum:this.leftCards.length}});
}

/**改变房间状态*/
p.changeState = function (n,ispeng) {
    if(this.state == n){
        return;
    }
    this.state = n;
    switch (n){
        case this.STATE_DEALCARD:
           break;
        case this.STATE_LACKCARD:
            //告知4个人 定缺
            this.sendToRoomPlayers({command:commands.ROOM_NOTIFY, content:{state:this.roomCommand_lackCard}});
            break;
        case this.STATE_PLAYCARD:
            //进入出牌状态
            this.waitQueue = {};
            //出牌的人能不能杠，胡
            var gangAble = cardUtil.getCardGangAble(this["cards"+this.curPlayIndex]);
            var huAble = cardUtil.getCardHuAble(this["cards"+this.curPlayIndex]);
            //碰牌之后的出牌，只能出，不能杠 胡
            if(ispeng){
                gangAble = false;
                huAble = false;
            }
            console.log("告知玩家"+this.curPlayIndex+",他可以出牌了");
            //告知当前玩家，他可以出牌，他是否可以胡 杠
            this.sendToOneRoomPlayer(this.curPlayIndex, {command:commands.ROOM_NOTIFY, content:{state:this.roomCommand_handleCard, gangAble:gangAble, huAble:huAble, pengAble:false, playAble:true}});
            //告知所有玩家 当前的出牌人
            this.sendToRoomPlayers({command:commands.ROOM_NOTIFY, content:{state:this.roomCommand_curPlayIndex, curPlayIndex:this.curPlayIndex}});
            break;
        case this.STATE_HANDLECARD:
            //等待其他玩家胡 杠 碰 过 然后下一位玩家才可以继续出牌
            break;
        case this.STATE_PAYOUT:
            break;
    }
}


p.haddlePlayerQuest = function (index, data) {
    var state = data.content.state;
    var sqs = data.sequence;
    switch (state){
        case this.playCommand_lackCard:
            this.handlePlayerLackCard(index, data.content.lack, sqs);
            break;
        case this.playCommand_playCard:
            this.handlePlayerPlarCard(index, data.content.card,sqs);
            break;
        case this.playCommand_gangCard:
            this.handlePlayerGangCard(index, data.content.card,sqs);
            break;
        case this.playCommand_guoCard:
            this.handlePlayerGuoCard(index);
            break;
        case this.playCommand_huCard:
            this.handlePlayerHuCard(index, sqs);
            break;
        case this.playCommand_pengCard:
            this.handlePlayerPengCard(index, sqs);
            break;
    }
}
/**给玩家定缺*/
p.handlePlayerLackCard = function (index, lackCard, sqs) {
    if(index<4){
        console.log('玩家'+index+"定缺"+lackCard);
        this["lackCard"+index] = lackCard;
        this.sendToOneRoomPlayer(index, {command:commands.ROOM_NOTIFY, sequence:sqs, code:0});
        if(this.lackCard0.length>0 && this.lackCard1.length>0 && this.lackCard2.length>0 && this.lackCard3.length>0){
            console.log("定缺完成");
            //告知所有玩家，所有人的定缺
            this.sendToRoomPlayers({command:commands.ROOM_NOTIFY, content:{state:this.roomCommand_lackCard, lackCards:[this.lackCard0, this.lackCard1, this.lackCard2, this.lackCard3]}})
            this.changeState(this.STATE_PLAYCARD);
        }
    }
}
/**玩家要出牌*/
p.handlePlayerPlarCard = function (index, card, sqs) {
    console.log(index+"玩家出牌 "+card,this["cards"+index]);
    var i = this["cards"+index].indexOf(card)
    if(i >= 0){
        this["cards"+index].splice(i, 1);
        this["playedCards"+index].push(card);
        this.curPlayedCard = card;
        //告知玩家出牌成功
        this.sendToOneRoomPlayer(index, {command:commands.ROOM_NOTIFY, code:0, sequence:sqs});
        //告知所有玩家 有人出牌了 刷新出过的牌的队列
        this.sendToRoomPlayers({command:commands.ROOM_NOTIFY, content:{state:this.roomCommand_playedCard, playedCards:{index:index, cards:this["playedCards"+index] }} });

        //另外三个人是否可以胡/杠/碰 这个牌
        var needWait = false;
        for(var n=0; n<4; n++){
            if(index != n){
                var huAble = cardUtil.getCardHuAble(this.cards0.concat([card]));
                var gangAble = cardUtil.getCardGangAbleByCard(this.cards0, card);
                var pengAble = cardUtil.getCardPengAbleByCard(this.cards0, card);

                if(huAble || gangAble || pengAble){
                    needWait = true;
                    //加入一个等待队列，等待玩家做出操作
                    var string = "";
                    if(huAble){
                        string =  string.length==0 ? string+"hu" : string+",hu";
                    }
                    if(gangAble){
                        string =  string.length==0 ? string+"gang" : string+",gang";
                    }
                    if(pengAble){
                        string =  string.length==0 ? string+"peng" : string+",peng";
                    }
                    //等待的玩家号和他的操作
                    this.waitQueue[n] = string;
                    //等待操作的对象牌
                    this.waitQueue[card] = card;

                    this.changeState(this.STATE_HANDLECARD);
                    this.sendToOneRoomPlayer(0, {command:commands.ROOM_NOTIFY,
                        content:{state:this.roomCommand_handleCard, huAble:huAble, gangAble:gangAble, pengAble:pengAble, playAble:false}}
                    );
                }
            }
        }

        //没人可以操作这张牌，就轮到下一个人摸牌
        if(!needWait) {
            console.log("没人可以操作这张牌，就轮到下一个人摸牌");
            this.addCurIndex();
            console.log("发牌给"+this.curPlayIndex);
            this.dealCard(this.curPlayIndex, this.getCard(1));
            console.log("改变状态机到出牌");
            this.changeState(this.STATE_PLAYCARD);
        }

    }
    else{
        console.log("玩家"+index+"没有这个牌"+card+"， 出牌失败");
    }
}
/**递增当前的操作玩家*/
p.addCurIndex = function () {
    this.curPlayIndex++;
    if(this.curPlayIndex > 3) this.curPlayIndex-=4;

    if(this["isPlayerHu"+this.curPlayIndex]){
        this.curPlayIndex++;
        if(this.curPlayIndex > 3) this.curPlayIndex-=4;
    }
    if(this["isPlayerHu"+this.curPlayIndex]){
        this.curPlayIndex++;
        if(this.curPlayIndex > 3) this.curPlayIndex-=4;
    }
}
/**是否3个人以上胡牌*/
p.checkPlayersHuNum = function () {
    var num = 0;
    if(this.isPlayerHu0){ num++; }
    if(this.isPlayerHu1){ num++; }
    if(this.isPlayerHu2){ num++; }
    if(this.isPlayerHu3){ num++; }
    return num >= 3;
}
/**等待队列中是否还有人可以胡牌*/
p.haveHuWait = function (index) {
    if(!this.waitQueue[index] || this.waitQueue[index].indexOf("hu")==-1){
        return false;
    }
    return true;
}
/**玩家要胡牌*/
p.handlePlayerHuCard = function (index, sqs) {
    //要胡的牌是什么牌 要发过来 自摸可以不发
    var card = 0;
    //当前玩家申请胡牌，那么他是自摸
    if(index == this.curPlayIndex){
        if(cardUtil.getCardHuAble(this["cards"+index])){
            this["isPlayerHu"+index] = true;
            this.sendToOneRoomPlayer(index,{command:commands.ROOM_NOTIFY, sequence:sqs, code:0});
            this.sendToOtherRoomPlayer(index,{command:commands.ROOM_NOTIFY, sequence:sqs, content:{state:this.roomCommand_huCard, huInfo:{index:index, card:-1}}});

            //计算还剩几个玩家没胡，如果只有1个，游戏结束
            if(this.checkPlayersHuNum()){
                console.log("3个人胡牌了 游戏结束");
                this.gameOver();
            }
            else{
                //游戏还未结束，下一个人继续摸牌
                this.addCurIndex();
                this.dealCard(this.curPlayIndex, this.getCard(1));
                this.changeState(this.STATE_PLAYCARD);
            }
        }
        else{
            console.log("玩家申请胡牌失败,他诈胡!");
            this.sendToOneRoomPlayer(index,{command:commands.ROOM_NOTIFY, sequence:sqs, code:codes.PLAY_ERROR});
        }
    }
    //其他玩家申请胡牌，点炮
    else{
        //该玩家在等待胡牌操作的队列中，才可以胡牌
        if(this.waitQueue && this.waitQueue[index] && this.waitQueue[index].indexOf("hu")!=-1){
            this["isPlayerHu"+index] = true;
            this.sendToOneRoomPlayer(index,{command:commands.ROOM_NOTIFY, sequence:sqs, code:0});
            this.sendToOtherRoomPlayer(index,{command:commands.ROOM_NOTIFY, sequence:sqs, content:{state:this.roomCommand_huCard, huInfo:{index:index, card:card}}});
            this.waitQueue[index] = "";

            //等待队列还有人可以胡，等待他胡牌
            if(haveHuWait(0) || haveHuWait(1) || haveHuWait(2) || haveHuWait(3)){
            }
            //没人可以胡牌了，继续摸牌
            else{
                this.curPlayIndex = index;
                if(this.checkPlayersHuNum()){
                    console.log("3个人胡牌了 游戏结束");
                    this.gameOver();
                }
                else{
                    //游戏还未结束，下一个人继续摸牌
                    this.addCurIndex();
                    this.dealCard(this.curPlayIndex, this.getCard(1));
                    this.changeState(this.STATE_PLAYCARD);
                }
            }
        }
        else{
            console.log("玩家申请胡牌失败,他诈胡!");
            this.sendToOneRoomPlayer(index,{command:commands.ROOM_NOTIFY, sequence:sqs, code:codes.PLAY_ERROR});
        }
    }
}
/**玩家要杠牌*/
p.handlePlayerGangCard = function (index, card, sqs) {
    //自杠
    if(index == this.curPlayIndex){
        if(cardUtil.getCardGangAble(this["cards"+this.curPlayIndex]) ){
            this.sendToOneRoomPlayer(index,{command:commands.ROOM_NOTIFY, sequence:sqs, code:0});
            this.sendToOtherRoomPlayer(index,{command:commands.ROOM_NOTIFY, content:{state:this.roomCommand_gangCard, gangOrPengInfo:{index:index, card:card, showedCards:this["showedCards"+index]}}});

            this.curPlayIndex = index;
            this.dealCard(this.curPlayIndex, this.getCard(1));
            this.changeState(this.STATE_PLAYCARD);
        }
        else{
            this.sendToOneRoomPlayer(index,{command:commands.ROOM_NOTIFY, sequence:sqs, code:codes.PLAY_ERROR});
        }
    }
    //点杠
    else{
        //有人可以胡，不让杠，可以胡的那个人过了，这个才可以杠
        if(this.haveHuWait(0) || this.haveHuWait(1) || this.haveHuWait(2) || this.haveHuWait(3)){

        }
        else{
            if(cardUtil.getCardGangAbleByCard(this["cards"+index], card)){
                this.sendToOneRoomPlayer(index,{command:commands.ROOM_NOTIFY, sequence:sqs, code:0});
                this.sendToOtherRoomPlayer(index,{command:commands.ROOM_NOTIFY, content:{state:this.roomCommand_gangCard, gangOrPengInfo:{index:index, card:card, showedCards:this["showedCards"+index]}}});

                this.curPlayIndex = index;
                this.dealCard(this.curPlayIndex, this.getCard(1));
                this.changeState(this.STATE_PLAYCARD);
            }
            else{
                this.sendToOneRoomPlayer(index,{command:commands.ROOM_NOTIFY, sequence:sqs, code:codes.PLAY_ERROR});
            }
        }
    }
}
/**玩家要碰牌*/
p.handlePlayerPengCard = function (index, sqs) {
    //有人可以胡，不让碰，可以胡的那个人过了，这个才可以碰
    if(this.haveHuWait(0) || this.haveHuWait(1) || this.haveHuWait(2) || this.haveHuWait(3)){

    }
    else{
        if(cardUtil.getCardPengAbleByCard(this["cards"+index], card)){
            this.sendToOneRoomPlayer(index,{command:commands.ROOM_NOTIFY, sequence:sqs, code:0});
            this.sendToOtherRoomPlayer(index,{command:commands.ROOM_NOTIFY, content:{state:this.roomCommand_pengCard, gangOrPengInfo:{index:index, card:card, showedCards:this["showedCards"+index]}}});

            this.curPlayIndex = index;
            this.changeState(this.STATE_PLAYCARD, true);
        }
        else{
            this.sendToOneRoomPlayer(index,{command:commands.ROOM_NOTIFY, sequence:sqs, code:codes.PLAY_ERROR});
        }
    }
}
/**玩家要过牌*/
p.handlePlayerGuoCard = function () {

}

/**没有牌了 或者 3个人胡牌了，游戏结束*/
p.gameOver = function () {
    
}
/**从剩余的牌组的开始取n张牌*/
p.getCard = function (n) {
    if(this.leftCards.length == 0){
        console.log("没有牌了 游戏结束");
        this.gameOver();
        return;
    }

    var arr = [];
    for(var i=0;i<n;i++){
        arr.push(this.leftCards.shift());
    }
    return arr;
}
/**向房间内的4个人发送消息*/
p.sendToRoomPlayers = function (data) {
    for(var i=0; i<this.players.length; i++){
        wss.sendMsg(this.players[i].ws, data);
    }
}
/**向房间内的一个人发送消息*/
p.sendToOneRoomPlayer = function(index, data){
    wss.sendMsg(this.players[index].ws, data);
}
/**向房间内的其他三人发送消息*/
p.sendToOtherRoomPlayer = function(index, data){
    if(index!=0) wss.sendMsg(this.players[0].ws, data);
    if(index!=1) wss.sendMsg(this.players[1].ws, data);
    if(index!=2) wss.sendMsg(this.players[2].ws, data);
    if(index!=3) wss.sendMsg(this.players[3].ws, data);
}

module.exports = RoomServer;
