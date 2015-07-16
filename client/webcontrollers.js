
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
    $scope.notificationsSupported = ('Notification' in window);
    $scope.notificationsEnabled = (window.localStorage.notificationsEnabled == "true");
    $scope.$watch('notificationsEnabled', function() {
      window.localStorage.notificationsEnabled = $scope.notificationsEnabled ? "true" : "";
    });
    $scope.toggleNotifications = function() {
      if ($scope.notificationsEnabled) {
        $scope.notificationsEnabled = false;
      } else {
        Notification.requestPermission(function(permission){
          $scope.$apply(function() {
            $scope.notificationsEnabled = true;
          });
        });
      }
    }
    $scope.preferences = function() {
      $location.path("/preferences");
    }
    $scope.changePassword = function(ev) {
      $mdDialog.show({
        controller: ChangePasswordController,
        templateUrl: 'partials/change_password.html',
        parent: angular.element(document.body),
        targetEvent: ev,
        onComplete: function(scope, element) {
          element[0].querySelector('[focus-me]').focus();
        }
      })
    }
    function update() {
      var loc = $scope.currentPage = $location.path();
      $scope.conversations = Jabber.conferences;
      angular.forEach($scope.conversations, function(item, id) {
        item.currentViewed = ("/chat/"+id == loc);
      });
    }

    $scope.doLogout = function() {
      $mdDialog.show($mdDialog.confirm().content("Are you sure?").ok("Logout").cancel("No"))
      .then(function() {
        Jabber.disconnect();
        window.localStorage.cred_password = "";
        $location.path("/login");
      });
    }
  })


.controller("WelcomeCtrl",
  function($scope, Jabber) {
    $scope.contacts = Jabber.contacts;

    $scope.joinJid = "";

    $scope.joinRoom = function() {
      var jid = new XMPP.JID($scope.joinJid);
      var room = new Jabber.Conversation({ jid: jid, autoJoin: true, name: jid.local });
      Jabber.conferences[jid.bare] = room;
      Jabber.joinRoom(room);
      room.bookmark();
    };
  })


;
