
angular.module( 'accountControllers', [  ] )

.controller("LoginCtrl",
  function($scope, $location, $mdToast, Jabber) {
    $scope.jabber = Jabber;

    $scope.register = function() {
      window.open(XMPP_REGISTER_FORM, "regform", "width=450,height=300");
    }

    $scope.login = function() {
      Jabber.connect()
      .then(function() {
        var s = $location.search();
        if (s.back) {
          $location.path(s.back).search({});
        } else {
          $location.path("/welcome");
        }
      }, function(error) {
        $mdToast.showSimple(error);

      }, function(notice) {
        $mdToast.showSimple(notice);

      });
    }

    if (Jabber.jid && Jabber.password && window.localStorage.login) $scope.login();


  })
.controller("PreferencesCtrl",
  function($scope, $location, $mdToast, Jabber) {
    $scope.jabber = Jabber;
    Jabber.client.getAccountInfo(undefined, function(err, res) {
      console.log("Prefs:",err,res);

    });


  })
;

function ChangePasswordController($scope, $mdDialog, Jabber) {
  $scope.new_password = "";
  $scope.repeat_password = "";
  $scope.username = "";
  Jabber.client.getAccountInfo(undefined, function(err, res) {
    console.log("Prefs:",err,res);
    $scope.username = res.register.username;
  });
  $scope.cancel = function() {
    $mdDialog.cancel();
  }
  $scope.changePassword = function() {
    console.log("change Password");
    if (!$scope.new_password || $scope.new_password.length < 6) {
      alert("Too short"); return;
    } else if ($scope.new_password != $scope.repeat_password) {
      alert("Not matching"); return;
    }
    Jabber.client.updateAccount(Jabber.client.jid.bare, {
      username: $scope.username,
      password: $scope.new_password
    }, function(err, res) {
      console.log("change Password success?",err, res);
      if (err || (res && res.error)) {
        alert("Changing password failed")
      } else {
        $mdDialog.hide();
      }
    })
  }
}
