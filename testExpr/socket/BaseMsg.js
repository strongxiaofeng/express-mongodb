/**
 * 消息的基本格式
 *
 * {
 *      command: number,
 *      code: number,
 *      sequence: number,
 *      content: {}
 * }
 *
 *
 * 服务器通知玩家:
 *      通知骰子点数, 该谁先摸
 *      通知一个玩家摸牌
 *      通知其他玩家 这个玩家手上有多少张牌
 *      通知所有玩家 定缺
 *      通知一个玩家可以出牌/胡/杠/碰
 *      通知其他玩家现在是谁在出牌
 *      通知所有玩家 某个玩家出了什么牌
 *      通知所有玩家 某个玩家胡了什么牌
 *      通知所有玩家 某个玩家杠了什么牌
 *      通知所有玩家 某个玩家碰了什么牌
 *      通知所有玩家 某个玩家碰的和杠的所有牌
 *      通知所有玩家 游戏结束
 *
 *      玩家发送出牌 杠 碰 胡 过 除了过，其他几种都要返回是否操作成功
 *
 *
 *
 * 服务器游戏通知的消息格式
 *
 * {
 *      command: ROOM_NOTIFY,
 *      content: {
 *          roomId:number,
 *          //通知类型 依次是
 *          通知骰子点数和庄家
 *          通知摸牌（通知自己和其他人）
 *          通知定缺
 *          通知所有玩家 当前的出牌人
 *          通知单个玩家可以操作 胡/杠/碰/出牌
 *          通知某个玩家出了什么牌，他一共出过哪些牌
 *          通知某个玩家胡了什么牌
 *          通知某个玩家杠了什么牌, 他摆出来的所有牌
 *          通知某个玩家碰了什么牌, 他摆出来的所有牌
 *          通知所有玩家 游戏结束
 *          state: 1/2/3/4/5/6/7/8/9/10,
 *
 *          //2个骰子摇出来的点数结果
 *          dice:2-12
 *          //当前出牌人
 *          currentIndex:number,
 *          //摸到的牌
 *          addCards:[].
 *          //他人牌数变动
 *          otherCardNum:[index:number, num:number],
 *          huAble:boolean,
 *          pengAble:boolean,
 *          gangAble:boolean,
 *          playAble:boolean,
 *          //某玩家出过的牌，最后一个表示刚打出的
 *          playedCard:{index:number,cards:[]},
 *          //某玩家胡牌,自摸的话不显示胡的牌
 *          huInfo:{index:number, card:number},
 *          //某玩家杠/碰牌
 *          gangOrPengInfo:{index:number, card:number, showedCards:[]},
 *
 *          name:"",
 *          //发出的牌
 *          addCards:[],
 *          //剩余的牌数
 *          leftCardsNum:number,
 *          //他人的牌数
 *          otherCardNum:number,
 *          //定缺
 *          lackCard:"wan"/"tiao"/"tong",
 *          //出牌,碰牌（告知当前该第index个玩家操作了）
 *          index:number,
 *          gangAble:false,
 *          huAble:false,
 *          pengAble:false,
 *          //玩家操作
 *          action: hu/gang/peng/guo/play,
 *          //玩家出牌的牌号
 *          card:number
 *      }
 * }
 *
 * 玩家发送给服务器的消息格式
 * {
 *      command: PLAY_GAME,
 *      sequence: number,
 *      content: {
 *          roomId:number,
 *          index:number,
 *          //玩家的名字，每个玩家socket只能发送自己的操作，如果name和这个socket不对应，操作就不合法
 *          name:string,
 *          //操作类型 定缺，出牌， 碰, 杠, 胡, 过
 *          actionType:1/2/3/4/5/6,
 *          lack:"wan/tiao/tong",
 *          card:number,
 *      }
 * }
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * */
