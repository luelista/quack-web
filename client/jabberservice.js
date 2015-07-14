
// Include app dependency on ngMaterial

angular.module( 'jabberService', [   ] )
.factory("Jabber", 
  function($q, $rootScope) {
    var svc = {
      jid: null,
      password: null,
      client: null,
      connected: false,
      conferences: {},
      contacts: [],
      avatars: {}
    };
    
    if (window.localStorage.cred_jid) svc.jid = window.localStorage.cred_jid;
    if (window.localStorage.cred_password) svc.password = window.localStorage.cred_password;
    
    svc.requestAvatar = function() {
    //  svc.getAvatar(
    }
    
    function Conversation(obj) {
      this.jid = null;
      this.subject = null;
      this.name = null;
      this.online = false;
      this.codes = [];
      this.role = ""; this.affiliation = "";
      this.messages = [];
      this.lastRead = new Date(0);
      this.lastReceived = new Date(0);
      console.log(obj);
      for(var k in obj) this[k] = obj[k];
      try {
        var stored = JSON.parse(window.localStorage["conversation_info_" + this.jid.bare]);
        if (stored && typeof stored == "object") {
          for(var k in stored) this[k] = stored[k];
          for(var msg in stored.msgs) {
            this.messages.push({
              from: new XMPP.JID(msg.from),
              to: new XMPP.JID(msg.to),
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
      for(var i = this.messages.length - 1; i >= 0; i--) {
        if(this.messages[i].dateTime <= this.lastRead) break;
        if(this.messages[i].body) this.unread++;
      }
      window.localStorage["conversation_info_" + this.jid.bare] = 
      JSON.stringify({
        name: this.name,
        lastRead: +this.lastRead,
        lastReceived: +this.lastReceived,
        msgs: this.messages.map(function(msg) {
          return {
            from: ''+msg.from,
            to: ''+msg.to,
            body: ''+msg.body,
            ts: +msg.dateTime
          };
        })
      });
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
    
    
    svc.connect = function() {
      var deferred = $q.defer();
      window.localStorage.cred_jid = svc.jid || "";
      window.localStorage.cred_password = svc.password || "";
      
      if (!svc.jid) {
        deferred.reject("Invalid Jabber ID");
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
          $rootScope.$broadcast('jabber.message', msg);
          if (msg.type == "groupchat") {
            var id = msg.from.bare, chat;
            if (chat = svc.conferences[id]) {
              if (msg.tstamp && msg.tstamp.tstamp && msg.tstamp.tstamp instanceof Date)
                msg.dateTime = msg.tstamp.tstamp;
              else if (msg.delay && msg.delay.stamp && msg.delay.stamp instanceof Date)
                msg.dateTime = msg.delay.stamp;
              else
                msg.dateTime = new Date();
              chat.lastReceived = msg.dateTime;
              chat.messages.push(msg);
              chat.persist();
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
      client.on('muc:subject', function(msg) {
        $rootScope.$apply(function() {
          var id = msg.from.bare, chat;
          if (chat = svc.conferences[id]) {
            chat.subject = msg.subject;
            $rootScope.$broadcast('jabber.conversationsChange');
          }
        });
      });
      client.on('muc:join', function(pres) {
        $rootScope.$apply(function() {
          var id = pres.from.bare, chat;
          if (chat = svc.conferences[id]) {
            console.log("muc join", id);
            chat.nick = pres.from.resource;
            chat.online = true;
            chat.codes = pres.muc.codes;
            chat.role = pres.muc.role; chat.affiliation = pres.muc.affiliation;
          }
        });
      });
      client.on('muc:leave', function(pres) {
        $rootScope.$apply(function() {
          var id = pres.from.bare, chat;
          if (chat = svc.conferences[id]) {
            console.log("muc left", id);
            chat.online = false;
          }
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
          resp.privateStorage.bookmarks.conferences.forEach(function(item) {
            var id = item.jid.bare;
            //console.log(JSON.stringify(item));
            if (old[id]) {
              svc.conferences[id] = old[id];
            } else {
              svc.conferences[id] = new Conversation(item);
            }
          });
          $rootScope.$broadcast('jabber.conversationsChange');
          resolve();
        });
      });
    }
    
    svc.disconnect = function() {
      if (svc.client) svc.client.disconnect();
      svc.client = null;
      delete window.localStorage.login;
    }
    
    svc.joinRoom = function(room) {
      svc.client.joinRoom(room.jid, svc.client.jid.local, {
        joinMuc: {
          history: { maxstanzas: "250", since: new Date(room.lastReceived) }
        }
      });
    }
    
    return svc;
  } );



