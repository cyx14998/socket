/**
 * Created by cyx on 2017/9/15.
 */
/*即时运行函数*/
(function () {
    "use strict";
    var d = document,
        w = window,
        dd = d.documentElement,
        db = d.body,
        dc = d.compatMode === "CSS1Compat",
        dx = dc ? dd : db,
        ec = encodeURIComponent,
        p = parseInt;
    var host = '192.168.2.182:3000'
    w.CHAT = {
        msgObj: d.getElementById("message"),
        screenHeight: w.innerHeight ? w.innerHeight : dx.innerHeight,
        userName: null,
        userId: null,
        socket: null,
        /*滚动条始终在最底部*/
        scrollToBottom: function () {
            w.scrollTo(0, this.msgObj.clientHeight);
        },
        /*此处仅为简单的刷新页面，当然可以做复杂点*/
        logout: function () {
            // this.socket.disconnect();
            w.top.location.reload();
        },
        submit: function () {
            var content = d.getElementById('content').value;
            if (content != '') {
                var obj = {
                    userId: this.userId,
                    userName: this.userName,
                    content: content
                };
                //如在服务器端代码所说，此对象就行想要发送的信息和发送人组合成为对象一起发送。
                this.socket.emit('message', obj);
                d.getElementById('content').value = '';
            }
            return false;
        },
        secSubmit: function(){
            var content = d.getElementById('content').value;
            if (content != '') {
                var obj = {
                    userId: this.userId,
                    userName: this.userName,
                    content: content
                };
                //如在服务器端代码所说，此对象就行想要发送的信息和发送人组合成为对象一起发送。
                this.socket.emit('secmessage', obj);
                d.getElementById('content').value = '';
            }
            return false;
        },
        /**客户端根据时间和随机数生成ID，聊天用户名称可以重复*/
        genUid: function () {
            return new Date().getTime() + "" + Math.floor(Math.random() * 889 + 100);
        },
        /*更新系统信息
        主要是在客户端显示当前在线人数，在线人列表等，当有新用户加入或者旧用户退出群聊的时候做出页面提示。*/
        updateSysMsg: function (o, action) {
            var onLineUsers = o.onLineUsers;
            var onLineCounts = o.onLineCounts;
            var user = o.user;
            //更新在线人数
            var userHtml = '';
            var separator = '';
            for (var key in onLineUsers) {
                if (onLineUsers.hasOwnProperty(key)) {
                    userHtml += separator + onLineUsers[key];
                    separator = '、';
                }
            }
            //插入在线人数和在线列表
            d.getElementById('onLineCounts').innerHTML = '当前共有' + onLineCounts + "在线列表： " + userHtml;

            //添加系统消息
            var html = '';
            html += '<div class="msg_system">';
            html += user.userName;
            html += (action === "login") ? "加入了群聊" : "退出了群聊";
            html += '</div>';
            var section = d.createElement('section');
            section.className = 'system J-mjrlinkWrap J-cutMsg';
            section.innerHTML = html;
            this.msgObj.appendChild(section);
            this.scrollToBottom();
        },

        /*用户提交用户名后，将loginbox设置为不显示，将chatbox设置为显示*/
        userNameSubmit: function () {
            var userName = d.getElementById('userName').value;
            if (userName != '') {
                d.getElementById('userName').value = '';
                d.getElementById('loginbox').style.display = 'none';
                d.getElementById('chatbox').style.display = 'block';
                this.init(userName);//调用init方法
            }
            return false;
        },
        //用户初始化
        init: function (userName) {
            //随机数生成uid
            this.userId = this.genUid();
            this.userName = userName;
            d.getElementById('showUserName').innerHTML = this.userName;//[newpidian]|[退出]
            this.scrollToBottom();
            //连接socketIO服务器,newpidian的IP地址
            this.socket = io.connect(host);
            //向服务器发送某用户已经登录了
            this.socket.emit('login', { userId: this.userId, userName: this.userName });
            //监听来自服务器的login，即在客户端socket.emit('login ')发送后，客户端就会收到来自服务器的
            // io.emit('login', {onLineUsers: onLineUsers, onLineCounts: onLineCounts, user: user});
            /*监听到有用户login了，更新信息*/
            this.socket.on('login', function (o) {
                //更新系统信息
                CHAT.updateSysMsg(o, 'login');
            });
            /*监听到有用户logout了，更新信息*/
            this.socket.on('logout', function (o) {
                CHAT.updateSysMsg(o, 'logout');
            });
            //var obj = {
            //    userId: this.userId,
            //    userName: this.userName,
            //    content: content
            //};
            /*监听到有用户发送消息了*/
            this.socket.on("message", function (obj) {
                //判断消息是不是自己发送的
                var isMe = (obj.userId === CHAT.userId);
                var contentDiv = '<div>' + obj.content + '</div>';

                //判断发送的是否是秘密消息
                var userNameDiv = (!isMe && obj.sec) ? '<span>神秘人物</span>' : '<span>' + obj.userName + '</span>';
                var section = d.createElement('section');
                if (isMe) {
                    section.className = 'user';
                    section.innerHTML = contentDiv + userNameDiv;
                } else {
                    section.className = 'service';
                    section.innerHTML = userNameDiv + contentDiv;
                }
                CHAT.msgObj.appendChild(section);
                CHAT.scrollToBottom();
            });
        }
    }
    /*控制键键码值(keyCode)
     按键 键码  按键  键码  按键  键码  按键  键码
     BackSpace  8   Esc 27  Right Arrow 39  -_  189
     Tab    9   Spacebar    32  Dw Arrow    40  .>  190
     Clear  12  Page Up 33  Insert  45  /?  191
     Enter  13  Page Down   34  Delete  46  `~ 192
     Shift  16  End 35  Num Lock    144 [{  219
     Control    17  Home    36  ;:  186 \|  220
     Alt    18  Left Arrow  37  =+  187 ]}  221
     Cape Lock  20  Up Arrow    38  ,<  188 '"  222
     * */
    //通过“回车键”提交用户名
    d.getElementById('userName').onkeydown = function (e) {
        e = e || event;
        if (e.keyCode === 13) {
            CHAT.userNameSubmit();
        }
    };
    //通过“回车键”提交聊天内容
    d.getElementById('content').onkeydown = function (e) {
        e = e || event;
        if (e.keyCode === 13) {
            CHAT.submit();
        }
    };
})();