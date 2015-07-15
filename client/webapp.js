

angular.module( 'bonfireApp', [ 'ngRoute', 'ngMaterial', 'bonfireControllers', 'jabberService', 'colorHelper' ] )
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

    $rootScope.$on('jabber.message', function(event, msg) {
      console.log("Message: ",msg.delay?"delayed":"NEW",msg);
      if (!msg.delay && msg.body)
        $mdToast.showSimple(""+msg.from+": "+msg.body);
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
      otherwise({
        redirectTo: '/login'
      });
  }])


.controller("YourController",
  function() {

  } );
