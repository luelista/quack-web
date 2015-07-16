
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
      if ($scope.chat.composing == "") return;
      $scope.chat.sendMessage({
        body: $scope.chat.composing
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

.directive('pasteImage', [ function() {

  function link(scope, element, attrs) {

    element.on('paste', function(e){
      var items = e.clipboardData.items;
      console.log(JSON.stringify(items));
      if (e.clipboardData.items[0].kind === 'file') {
        // get the blob
        var imageFile = items[0].getAsFile();
        console.log(imageFile);
        submitFileForm(imageFile, 'paste');
      }
    });

    element.on('dragenter', noopHandler);
    element.on('dragexit', noopHandler);
    element.on('dragover', noopHandler);
    element.on('drop', drop);

    function noopHandler(e) {
        e.stopPropagation();
        e.preventDefault();
    }
    function drop(e) {
        e.stopPropagation();
        e.preventDefault();

        var files = e.dataTransfer.files;
        if (files && files[0]) {
          submitFileForm(files[0], "drop");
        }
    }
    function submitFileForm(file, type) {
      console.log(file);
      var formData = new FormData();
      formData.append('file', file, 'file.jpg');
      formData.append('submission-type', type);

      var xhr = new XMLHttpRequest();
      xhr.open('POST', FILE_UPLOAD_API_ENDPOINT+'/api/upload/file');
      xhr.onload = function () {
        if (xhr.status == 200) {
          console.log('all done: ');
          var result = JSON.parse(xhr.responseText);
          var url = FILE_UPLOAD_API_ENDPOINT+'/'+result.hash+'.jpg';
          scope.$apply(function() {
            element[0].value += url;
          });
        } else {
          console.log('Nope');
        }
      };

      xhr.send(formData);
    }

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

.filter('formatMessage', function($sce) {
    var urls = /(\b(https?|ftp):\/\/[A-Z0-9+&@#\/%?=~_|!:,.;-]*[-A-Z0-9+&@#\/%=~_|])/gim;
    var image_urls = /(\b(https?):\/\/[A-Z0-9+&@#\/%?=~_|!:,.;-]*[-A-Z0-9+&@#\/%=~_|]\.(jpg|png|gif|webp))/gim;
    var emails = /(\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,6})/gim
    var tags = /</g;
    var wrap = /\n/g;

    return function(text) {
        text = text.replace(tags, '&lt;');
        text = text.replace(wrap, '\n<br>');

        if(text.match(urls)) {
            text = text.replace(urls, "<a href=\"$1\" target=\"_blank\">$1</a>")
        }
        if(text.match(emails)) {
            text = text.replace(emails, "<a href=\"mailto:$1\">$1</a>")
        }
        var match;
        if (match = text.match(image_urls)) {
          text += "<div><img src='"+match[0]+"' class='img-preview loading' onload='this.className=\"img-preview\"' onerror='this.parentNode.innerHTML=\"\"'></div>";
        }
        return $sce.trustAsHtml(text);
    }
})

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
