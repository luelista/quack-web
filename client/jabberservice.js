
// Include app dependency on ngMaterial

angular.module( 'jabberService', [   ] )
.factory("Jabber", 
  function($q, $rootScope) {
    var svc = {
      jid: null,
      password: null,
      client: null,
      connected: false,
      conferences: [],
      contacts: []
    };
    
    if (window.localStorage.cred_jid) svc.jid = window.localStorage.cred_jid;
    if (window.localStorage.cred_password) svc.password = window.localStorage.cred_password;
    
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
      
      client.on('auth:success', function() {
        deferred.notify("Login successful");
      });
      client.on('stream:error', function(err) {
        console.log("Stream error", err);
        deferred.reject("Stream error");
      });
      client.on('stream:data', function(err) {
        //console.log("Stream data", err);
      });
      client.on('auth:failed', function(err) {
        console.log("Auth error", err);
        deferred.reject("Auth error");
      });
      client.on('disconnected', function(err) {
        console.log("Disconnect");
        svc.connected = false;
        $rootScope.$broadcast('jabber.connectionChange', true);
      });
      client.on('connected', function(err) {
        console.log("connected");
        svc.connected = true;
        $rootScope.$broadcast('jabber.connectionChange', true);
      });

      client.on('session:started', function () {
        client.enableCarbons(function (err) {
          if (err) {
            console.log('Server does not support carbons');
          }
        });
        client.getRoster(function (err, resp) {
          console.log(resp);
          client.updateCaps();
          client.sendPresence({
              caps: client.disco.caps
          });
        });
        svc.updateConversations();
        window.localStorage.login = true;
        deferred.resolve();
      });

      client.connect();
      return deferred.promise;
    }
    
    svc.updateConversations = function() {
      
      svc.client.getBookmarks(function(err, resp) {
        svc.conferences = resp.privateStorage.bookmarks.conferences;
        $rootScope.$broadcast('jabber.conversationsChange');
      });
    }
    
    svc.disconnect = function() {
      if (svc.client) svc.client.disconnect();
      svc.client = null;
      delete window.localStorage.login;
    }
    
    return svc;
  } );



