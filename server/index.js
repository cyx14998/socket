/**
 * Created by cyx on 2017/9/15.
 */
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
// app.get('/', function (req, res) {
//     "use strict";
// });
app.use(express.static('client'));

/*在线人员*/
var onLineUsers = {};
/* 在线人数*/
var onLineCounts = 0;

/*io监听到存在连接，此时回调一个socket进行socket监听*/
io.on('connection', function (socket) {
    console.log('a user connected');
    /*监听新用户加入*/
    socket.on('login', function (user) {
        "use strict";
        //暂存socket.name 为user.userId;在用户退出时候将会用到
        socket.name = user.userId;
        /*不存在则加入 */
        if (!onLineUsers.hasOwnProperty(user.userId)) {
            //不存在则加入
            onLineUsers[user.userId] = user.userName;
            onLineCounts++;
        }
        /*一个用户新加入，向所有客户端监听login的socket的实例发送响应，响应内容为一个对象*/
        io.emit('login', { onLineUsers: onLineUsers, onLineCounts: onLineCounts, user: user });
        console.log(user.userName, "加入了聊天室");//在服务器控制台中打印么么么用户加入到了聊天室
    });
    /*监听用户退出聊天室*/
    socket.on('disconnect', function () {
        "use strict";
        if (onLineUsers.hasOwnProperty(socket.name)) {
            var user = { userId: socket.name, userName: onLineUsers[socket.name] };
            delete onLineUsers[socket.name];
            onLineCounts--;

            /*向所有客户端广播该用户退出群聊*/
            io.emit('logout', { onLineUsers: onLineUsers, onLineCounts: onLineCounts, user: user });
            console.log(user.userName, "退出群聊");
        }
    })
    /*监听到用户发送了消息，就使用io广播信息，信息被所有客户端接收并显示。注意，如果客户端自己发送的也会接收到这个消息，故在客户端应当存在这的判断，是否收到的消息是自己发送的，故在emit时，应该将用户的id和信息封装成一个对象进行广播*/
    socket.on('message', function (obj) {
        "use strict";
        /*监听到有用户发消息，将该消息广播给所有客户端*/
        io.emit('message', obj);
        console.log(obj.userName, "说了:", obj.content);
    });
    // 用户发送秘密消息
    socket.on('secmessage', function (obj) {
        "use strict";
        /*监听到有用户发秘密消息，将该消息广播给所有客户端*/
        // 打个tag。告诉客户端，这是秘密消息
        obj.sec = true;
        io.emit('message', obj);
        console.log(obj.userName, "说了:", obj.content);
    });
});
/*监听3000*/
http.listen(3000, function (req, res) {
    "use strict";
    console.log('listening 3000');
});