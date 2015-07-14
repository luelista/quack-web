
// Include app dependency on ngMaterial
var XMPP_WEBSOCKET_SERVICE = 'wss://teamwiki.de:5281/xmpp-websocket/';


angular.module( 'bonfireControllers', [  ] )

.controller("SidebarCtrl",
  function($rootScope, $scope, $mdDialog, Jabber, $location) {
    $scope.user = { jid: Jabber.jid };
    $scope.conversations = Jabber.conferences;
    $rootScope.$on('jabber.connectionChange', function(state) {
      if (state) $scope.user.jid = Jabber.jid; else $scope.user.jid = "";
    });
    $rootScope.$on('jabber.conversationsChange', function(state) {
      update();
    });
    $rootScope.$on('$routeChangeSuccess', function(event, current) {
      update();
    });
    function update() {
      var loc = $scope.currentPage = $location.path();
      console.log($location);
      $scope.conversations = Jabber.conferences.map(function(c) {
        c.currentViewed =  ("/chat/"+c.jid.bare == loc);
        return c;
      });
    }
    
    $scope.doLogout = function() {
      $mdDialog.show($mdDialog.confirm().content("Are you sure?").ok("Logout").cancel("No"))
      .then(function() {
        Jabber.disconnect();
        $location.path("/login");
      });
    }
  })
  
.controller("LoginCtrl",
  function($scope, $location, $mdToast, Jabber) {
    $scope.jabber = Jabber;
    
    
    $scope.login = function() {
      Jabber.connect()
      .then(function() {
        $location.path("/welcome");
      }, function(error) {
        $mdToast.showSimple(error);
        
      }, function(notice) {
        $mdToast.showSimple(notice);
        
      });
    }
    
    if (Jabber.jid && Jabber.password && window.localStorage.login) $scope.login();
    
    
  })
  
.controller("WelcomeCtrl",
  function($scope) {
    
  })
  
.controller("ChatCtrl",
  function($scope, $routeParams) {
    $scope.jid = $routeParams.chatId;
  })
    
;



