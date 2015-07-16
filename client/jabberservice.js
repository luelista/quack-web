
// Include app dependency on ngMaterial

angular.module( 'jabberService', [   ] )
.factory("Jabber",
  function($q, $rootScope) {
    var svc = {
      jid: null,
      password: null,
      client: null,
      connected: false,
      openChats: [],
      conferences: {},
      contacts: [],
      avatars: {}
    };

    if (window.localStorage.cred_jid) svc.jid = window.localStorage.cred_jid;
    if (window.localStorage.cred_password) svc.password = window.localStorage.cred_password;

    svc.requestAvatar = function() {
    //  svc.getAvatar(
    }


    // class Conversation
    function Conversation(obj) {
      this.jid = null;
      this.type = "groupchat";
      this.subject = null;
      this.name = null;
      this.online = false;
      this.codes = [];
      this.role = ""; this.affiliation = "";
      this.messages = [];
      this.occupants = {};
      this.lastRead = new Date(0);
      this.lastReceived = new Date(0);
      for(var k in obj) this[k] = obj[k];
      try {
        var stored = JSON.parse(window.localStorage["conversation_info_" + this.jid.bare]);
        if (stored && typeof stored == "object") {
          for(var k in stored)if(k!="jid") this[k] = stored[k];
          for(var i in stored.msgs) {
            var msg = stored.msgs[i];
            //console.log("message from localStorage:",msg);
            this.messages.push({
              from: new XMPP.JID(msg.from),
              body: msg.body,
              dateTime: new Date(msg.ts)
            });
          }
        }
      }catch(ex){ console.log("Unable to read information about "+this.jid.bare +" from persistence",ex); }
      this.persist();
    }
    Conversation.prototype.toString = function() {
      return this.name ? this.name :
              this.subject ? this.subject :
              this.jid.bare;
    }
    Conversation.prototype.persist = function() {
      this.unread = 0;
      var date = "";
      for(var i = 0; i < this.messages.length; i++) {
        if ((this.messages[i].dateTime > this.lastRead) && (this.messages[i].body)) this.unread++;
        var d = new Date(this.messages[i].dateTime);
        var e = d.getFullYear()+"-"+d.getMonth()+"-"+d.getDate();
        if (date != e) {
          this.messages[i].header = true;
          date = e;
        } else {
          this.messages[i].header = false;
        }
      }
      window.localStorage["conversation_info_" + this.jid.bare] =
      JSON.stringify({
        name: this.name,
        type: this.type,
        lastRead: +this.lastRead,
        lastReceived: +this.lastReceived,
        msgs: this.messages.filter(function(msg) {
          return !!msg.body;
        }).map(function(msg) {
          return {
            from: ''+msg.from,
            body: ''+msg.body,
            ts: +msg.dateTime
          };
        })
      });
    }
    Conversation.prototype.insertMessage = function(msg) {
      if (msg.id) {
        for(var i in this.messages) {
          if (this.messages[i].id == msg.id) {
            this.messages[i] = msg;
            return;
          }
        }
      }
      this.messages.push(msg);
    }
    Conversation.prototype.sendMessage = function(msg) {
      msg.from = svc.client.jid;
      msg.to = this.jid;
      msg.type = this.type;
      msg.id = uuid();
      if (msg.type == "groupchat") msg.sending = true;
      msg.dateTime = new Date();
      svc.client.sendMessage(msg);
      this.messages.push(msg);
      this.persist();
    }
    Conversation.prototype.unbookmark = function() {
      svc.client.removeBookmark(this.jid, function(ok) {
        console.log(ok);
      });
    }
    Conversation.prototype.bookmark = function() {
      svc.client.addBookmark({
          jid:this.jid,
          name: this.name,
          nick: this.nick,
          autoJoin: this.autoJoin
      }, function(ok) {
        console.log(ok);
      });
    }
    Conversation.prototype.part = function() {
      console.log("going to leave",this.jid);
      svc.client.leaveRoom(this.jid.bare, this.nick, function(ok) {
        console.log("leave?",ok);
      });
    }
    svc.Conversation = Conversation;
    // end class Conversation

    // class Occupant
    function Occupant(nick, obj) {
      this.nick = nick;
      this.role = null;
      this.affiliation = null;
      this.jid = null;
      this.chatState = "";
      for(var k in obj) this[k] = obj[k];
    }
    svc.Occupant = Occupant;
    // end class Occupant


    svc.connect = function() {
      var deferred = $q.defer();
      window.localStorage.cred_jid = svc.jid || "";
      window.localStorage.cred_password = svc.password || "";

      if (!svc.jid) {
        deferred.reject("Invalid Jabber ID");
        return deferred.promise;
      }
      var jid = new XMPP.JID(svc.jid);
      if (XMPP_ALLOWED_HOSTS.indexOf(jid.domain) === -1) {
        deferred.reject("Only Jabber accounts from these servers are allowed: "+XMPP_ALLOWED_HOSTS.join(', '));
        return deferred.promise;
      }
      if (svc.client && svc.connected) {
        deferred.resolve();
        return deferred.promise;
      }

      console.log(svc.jid);

      var client = svc.client = XMPP.createClient({
        jid: svc.jid,
        password: svc.password,
        wsURL: XMPP_WEBSOCKET_SERVICE,
        transports: ["old-websocket"]
      });

      (function(JXT) {
        var JabberTstamp = JXT.define({
          name: 'tstamp',
          namespace: 'jabber:x:tstamp',
          element: 'x',
          fields: {
            tstamp: JXT.utils.dateAttribute('tstamp')
          }
        });

        JXT.extendMessage(JabberTstamp);
      })(client.stanzas);

      client.on('auth:success', function() {
        $rootScope.$apply(function() {
          deferred.notify("Login successful");
        });
      });
      client.on('stream:error', function(err) {
        $rootScope.$apply(function() {
          console.log("Stream error", err);
          deferred.reject("Stream error");
        });
      });
      client.on('stream:data', function(err) {
        //console.log("Stream data", err);
      });
      client.on('auth:failed', function(err) {
        $rootScope.$apply(function() {
          console.log("Auth error", err);
          deferred.reject("Auth error");
        });
      });
      client.on('disconnected', function(err) {
        console.log("Disconnect");
        $rootScope.$apply(function() {
          svc.connected = false;
          $rootScope.$broadcast('jabber.connectionChange', true);
        });
      });
      client.on('connected', function(err) {
        console.log("connected");
        $rootScope.$apply(function() {
          svc.connected = true;
          $rootScope.$broadcast('jabber.connectionChange', true);
        });
      });
      client.on('message', function(msg) {
        $rootScope.$apply(function() {
          var id = msg.from.bare, chat = svc.conferences[id];
          $rootScope.$broadcast('jabber.message', msg, chat);
          if (msg.type == "error") {
            console.log("Error:", msg.error);
          } else if (msg.type == "groupchat" ||msg.type == "chat" || !msg.type) {
            if (msg.type != "groupchat" && !chat) {
              var contact = svc.getContact(id), fullName = contact ? contact.name : null;
              chat = new Conversation({ jid: new XMPP.JID(msg.from.bare), type: 'chat', name: fullName });
              svc.conferences[id] = chat;
            }
            if (chat) {
              if (msg.chatState) {
                var occ;
                if (msg.type != "groupchat") {
                  chat.chatState = msg.chatState;
                } else if (occ = chat.occupants[msg.from.resource]) {
                  occ.chatState = msg.chatState;
                }
              }
              if (msg.body || msg.subject) {
                if (msg.tstamp && msg.tstamp.tstamp && msg.tstamp.tstamp instanceof Date)
                  msg.dateTime = msg.tstamp.tstamp;
                else if (msg.delay && msg.delay.stamp && msg.delay.stamp instanceof Date)
                  msg.dateTime = msg.delay.stamp;
                else
                  msg.dateTime = new Date();
                chat.lastReceived = msg.dateTime;
                console.log($rootScope.focused ,chat.currentViewed)
                if ($rootScope.focused && chat.currentViewed)
                  chat.lastRead = msg.dateTime;
                chat.insertMessage(msg);
                chat.persist();
              }
            }

          }
        });
      });
      client.on('avatar', function(avatar) {
        svc.avatars[avatar.jid.bare] = avatar.avatars[0].id;
        svc.client.getAvatar(avatar.jid, avatar.avatars[0].id, function(x,y,z){
          console.log("avatar result",avatar.jid.bare,avatar.avatars[0].id,x,y,z);
        });
      });
      function onMucEvent(item, callback) {
        var id = item.from ? item.from.bare : '', chat;
        if (chat = svc.conferences[id]) {
          $rootScope.$apply(function() {
            callback(id, chat);
          });
        }
      }
      client.on('muc:subject', function(msg) {
        onMucEvent(msg, function(id, chat) {
            chat.subject = msg.subject;
            $rootScope.$broadcast('jabber.conversationsChange');
        });
      });
      client.on('muc:join', function(pres) {
        onMucEvent(pres, function(id, chat) {
            console.log("muc join", id);
            chat.nick = pres.from.resource;
            chat.online = true;
            chat.codes = pres.muc.codes;
            chat.role = pres.muc.role; chat.affiliation = pres.muc.affiliation;
        });
      });
      client.on('muc:leave', function(pres) {
        onMucEvent(pres, function(id, chat) {
            console.log("muc left", id);
            chat.online = false;
        });
      });
      client.on('muc:available', function(pres) {
        onMucEvent(pres, function(id, chat) {
          var nick = pres.from.resource;
          chat.occupants[nick] = new Occupant(nick, {
            jid: pres.muc.jid,
            affiliation: pres.muc.affiliation,
            role: pres.muc.role
          });
        });
      });
      client.on('muc:unavailable', function(pres) {
        onMucEvent(pres, function(id, chat) {
          var nick = pres.from.resource;
          delete chat.occupants[nick];
        });
      });

      client.on('session:started', function () {
        $rootScope.$apply(function() {
          client.enableCarbons(function (err) {
            if (err) {
              console.log('Server does not support carbons');
            }
          });
          client.getRoster(function (err, resp) {
            svc.contacts = resp.roster.items;
            $rootScope.$broadcast('jabber.contactsChange');
            client.updateCaps();
            client.sendPresence({
                caps: client.disco.caps
            });
          });
          svc.updateConversations().then(function() {
            angular.forEach(svc.conferences, function(chat) {
              if (chat.autoJoin)
                svc.joinRoom(chat);
            });
            deferred.resolve();
          });
          window.localStorage.login = true;
        });
      });

      client.connect();
      return deferred.promise;
    }

    svc.updateConversations = function() {
      return $q(function(resolve, reject) {
        svc.client.getBookmarks(function(err, resp) {
          var old = svc.conferences;
          svc.conferences = {};
          var conferences = resp.privateStorage.bookmarks.conferences;
          if (!conferences) conferences = [];
          conferences.forEach(function(item) {
            var id = item.jid.bare;
            //console.log(JSON.stringify(item));
            if (old[id]) {
              svc.conferences[id] = old[id];
            } else {
              svc.conferences[id] = new Conversation(item);
            }
          });
          angular.forEach(window.localStorage, function(value, key) {
            if (key.indexOf("conversation_info_") !== 0) return;
            try { value = JSON.parse(value); } catch(ex) { return; }
            if (value.type != "chat") return;
            var id = key.substr(18);
            value.jid = new XMPP.JID(id);
            if (!svc.conferences[id]) svc.conferences[id] = new Conversation(value);
          });
          $rootScope.$broadcast('jabber.conversationsChange');
          resolve();
        });
      });
    }

    svc.getContact = function(jid) {
      return svc.contacts.filter(function(x) { return x.jid.bare == jid; })[0];
    }

    svc.disconnect = function() {
      if (svc.client) svc.client.disconnect();
      svc.client = null;
      delete window.localStorage.login;
    }

    svc.joinRoom = function(room) {
      var historyRequest = { maxstanzas: "250" };
      if (room.lastReceived > 0)
        historyRequest = { since: new Date(room.lastReceived+1) };
      svc.client.joinRoom(room.jid, svc.client.jid.local, {
        joinMuc: {
          history: historyRequest
        }
      });
    }


    return svc;
  } );

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}
