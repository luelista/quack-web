
angular.module( 'chatControllers', [  ] )



.controller("ChatCtrl",
  function($scope, $routeParams, Jabber, $mdToast, $mdDialog) {
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
    $scope.rename = function(ev) {
      $mdDialog.show({
        controller: RenameChatController,
        templateUrl: 'partials/rename_chat.html',
        parent: angular.element(document.body),
        targetEvent: ev,
        locals: { chat: $scope.chat },
        focusOnOpen: false,
        onComplete: function(scope, element) {
          element[0].querySelector('[focus-me]').focus();
        }
      });
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



function RenameChatController($scope, $mdDialog, Jabber, chat) {
  $scope.chat_name = chat.name;
  $scope.subject = chat.subject;
  $scope.cancel = function() {
    $mdDialog.cancel();
  }
  $scope.ok = function() {
    chat.name = $scope.chat_name;
    if ($scope.subject != chat.subject)
      Jabber.client.setSubject(chat.jid, $scope.subject);
    chat.persist();
    $mdDialog.hide();
  }
}
