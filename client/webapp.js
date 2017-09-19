

angular.module( 'quackApp', [ 'ngRoute', 'ngMaterial', 'quackControllers',
                                'chatControllers', 'accountControllers',
                                'jabberService', 'colorHelper', 'ui.sortable' ] )
.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('teal')
    .accentPalette('indigo');
})

.filter('escape', function() {
  return window.encodeURIComponent;
})

.run(
  function($rootScope, $location, $routeParams, Jabber, $mdToast, $mdSidenav) {
    $rootScope.$on('$routeChangeSuccess', function(event, current) {
      if ($location.path().indexOf("/login") === 0) {
        $rootScope.showSideBar = false;
      } else {
        $rootScope.showSideBar = true;
        if (Jabber.connected == false) {
          var old = $location.path();
          $location.path("/login").search({back: old});
        }
      }
    });

    $rootScope.focused = true;
    window.onblur = function() {
      $rootScope.focused = false;
    }
    window.onfocus = function() {
      $rootScope.focused = true;
      var chat = Jabber.getCurrentViewedConference();
      if (chat) {
        $rootScope.$apply(function() {
          chat.markAsRead();
        });
      }
    }

    $rootScope.$on('jabber.message', function(event, msg, chat) {
      console.log("Message: ",msg.delay?"delayed":"NEW",msg);
      if (!msg.delay && msg.body) {
        console.log("Notify Check:",chat.notify,"Nickname:",chat.nick,"body=",msg.body,"focus=",$rootScope.focused);
        if (chat.notify == 'never') return;
        if (chat.notify == 'mention' && msg.body.indexOf(chat.nick) === -1) return;

        if (!$rootScope.focused && window.localStorage.notificationsEnabled == "true" && Notification.permission === "granted") {
          var body = msg.body;
          if (msg.type == "groupchat") body=msg.from.resource+": "+body;
          if (chat.notification) chat.notification.close();
          chat.notification = new Notification(msg.from.local,{body:body,icon:'/images/person.jpg', dir:'auto'});
          chat.notification.onclick=function() {
            $rootScope.$apply(function() {
              $location.path('/chat/' + msg.from.bare);
              window.focus();
            });
          }
        } else {
          if (!chat.currentViewed)
            $mdToast.showSimple(""+msg.from+": "+msg.body);
        }
      }
    });

    $rootScope.toggleSideBar = function() {
      $mdSidenav('left').open()
    }
  })

.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/login', {
        templateUrl: 'partials/login.html',
        controller: 'LoginCtrl'
      }).
      when('/welcome', {
        templateUrl: 'partials/welcome.html',
        controller: 'WelcomeCtrl'
      }).
      when('/chat/:chatId', {
        templateUrl: 'partials/chat.html',
        controller: 'ChatCtrl'
      }).
      when('/preferences', {
        templateUrl: 'partials/preferences.html',
        controller: 'PreferencesCtrl'
      }).
      otherwise({
        redirectTo: '/login'
      });
  }])


.controller("YourController",
  function() {

  } );
