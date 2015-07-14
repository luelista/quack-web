
// Include app dependency on ngMaterial

angular.module( 'bonfireApp', [ 'ngRoute', 'ngMaterial', 'bonfireControllers', 'jabberService' ] )
.filter('escape', function() {
  return window.encodeURIComponent;
})

.run(
  function($rootScope, $location, $routeParams, Jabber) {
    $rootScope.$on('$routeChangeSuccess', function(event, current) {
      if ($location.path() == "/login") {
        $rootScope.showSideBar = false;
      } else {
        $rootScope.showSideBar = true;
        if (Jabber.connected == false) {
            $location.path("/login");
        }
      }
    });
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



