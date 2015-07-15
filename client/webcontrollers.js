
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

.controller("ChatCtrl",
  function($scope, $routeParams, Jabber, $mdToast) {
    var id = $scope.jid = $routeParams.chatId;
    $scope.chat = Jabber.conferences[id];
    if (!$scope.chat) {
      $mdToast.showSimple("Unknown conference"); return;
    }
    $scope.skipItemCount = $scope.chat.messages.length - 75;
    $scope.chat.composing = $scope.chat.composing || "";
    $scope.chat.lastRead = $scope.chat.lastReceived;
    $scope.chat.persist();

    $scope.sendMessage = function() {
      console.log($scope.chat.composing);
      Jabber.client.sendMessage({
        body: $scope.chat.composing,
        to: $scope.chat.jid,
        type: "groupchat"
      });
      $scope.chat.composing = "";
    }
    $scope.$on("sendmessage", function() {
      $scope.sendMessage();
    });
    $scope.$on("reachedtop", function() {
      $scope.skipItemCount = Math.max(0, $scope.skipItemCount - 25);
    });

    $scope.goOnline = function() {
      Jabber.joinRoom($scope.chat);
      $scope.chat.autoJoin = true;
      $scope.chat.bookmark();
    }
    $scope.goOffline = function() {
      $scope.chat.part();
      $scope.chat.autoJoin = false;
      $scope.chat.bookmark();
    }
    $scope.delete = function() {
      $scope.chat.unbookmark();
    }
    $scope.rename = function() {

    }
  })

.directive('chatWriteMessage', ['$interval', 'dateFilter', function($interval, dateFilter) {

  function link(scope, element, attrs) {
    element.on("keyup", function(e) {
      if (e.keyCode == 13 && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        scope.$apply(function() {
          scope.$emit("sendmessage");
        });
      }
    });
    element.on("keydown", function(e) {
      if (e.keyCode == 13 && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
      }
    });
  }

  return {
    //scope: { onSendMessage: '&' },
    link: link
  };
}])

// maybe replace with https://github.com/Luegg/angularjs-scroll-glue/blob/master/src/scrollglue.js#L62
.directive('scrollDown', ['$interval',function($interval) {
  return {
    link: function link(scope, $element, attrs) {
      var element = $element[0];
      function scroll() {
        //console.log("scroll",element);
        element.scrollTop = element.scrollHeight;
      }
      scope.$watch(function() {
        //console.log(element.scrollHeight, element.scrollTop)
        if (element.scrollHeight - element.scrollTop - element.clientHeight < 400)
          scroll();

        //else
        //  console.log("scroll-down: not scrolling down because too far scrolled up");
      });
      $interval(scroll, 1, 1);
      $element.on("scroll", function() {
        if (element.scrollTop == 0) {
          scope.$apply(function() {
            scope.$emit("reachedtop");
            element.scrollTop = 20;
          });
        }
      });
    }
  };
}])


;
