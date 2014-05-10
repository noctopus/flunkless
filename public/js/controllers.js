'use strict';

function ChatAppCtrl($scope, $q, $modal, socket, useragent, geolocation) {
  console.log("IN CHAT APP")
  $scope.peopleCount = 0;
  $scope.messages = [];
  $scope.user = {}; //holds information about the current user
  $scope.users = {}; //holds information about ALL users
  $scope.rooms = []; //holds information about all rooms
  $scope.error = {};
  $scope.typingPeople = [];
  $scope.username = '';
  $scope.joined = false;
  $scope.loading=false;
  $scope.addedRooms = [];
  $scope.peopleOnline = [];
  $scope.create=false;
  $scope.modes = ["Send", "Link", "Pin", "To Professor"];
  $scope.writeMode = $scope.modes[0];
  $scope.pinnedPosts = [
  {message : "Hello!, this is item 1", type : 'message'}, 
  {message : 'Schedule document', type : 'link', src: 'www.google.com'}];
  var typing = false;
  var timeout  = undefined;

  /* ABOUT PAGE */
  $scope.about = function() {
    var modalInstance = $modal.open({
      templateUrl: 'aboutModal',
      controller: aboutModalCtrl
    });
  };

  var aboutModalCtrl = function($scope, $modalInstance) {
    $scope.cancel = function() {
      $modalInstance.dismiss('cancel');
    };
  };
  /* ABOUT PAGE END */

  $scope.setUsername = function(suggestedUsername) {
    $scope.username = suggestedUsername;
  }

  function timeoutFunction() {
    typing = false;
    socket.emit('typing', false);
  }

  $scope.focus = function(bool) {
    $scope.focussed = bool;
  }
  $scope.typing = function(event, room) {
    if (event.which !== 13) {
      if (typing === false && $scope.focussed && room !== null) {
        typing = true;
        socket.emit('typing', true);
      } else {
        clearTimeout(timeout);
        timeout = setTimeout(timeoutFunction, 1000);
      }
    }
  }

  socket.on('isTyping', function(data) {
    if (data.isTyping) {
      $scope.isTyping = data.isTyping;
      $scope.typingPeople.push(data.person);
    } else {
      $scope.isTyping = data.isTyping;
      var index = $scope.typingPeople.indexOf(data.person);
      $scope.typingPeople.splice(index, 1);
      $scope.typingMessage = '';
    }
  });

  $scope.joinServer = function() {
    $scope.user.name = this.username;
    if ($scope.user.name.length === 0) {
      $scope.error.join ='Please enter a username';
    } else {
      $scope.loading=true;
      var usernameExists = false;
      socket.emit('checkUniqueUsername', $scope.user.name, function(data) {
        usernameExists = data.result;
        if (usernameExists) {
          $scope.error.join = 'Username ' + $scope.user.name + ' already exists.';
          socket.emit('suggest', $scope.user.name, function(data) {
            $scope.suggestedUsername = data.suggestedUsername;
            $scope.loading=false;
          });
        } else {
          socket.emit('joinSocketServer', {name: $scope.user.name});
          $scope.joined = true;
          $scope.error.join = '';
          $scope.loading=false;
        }
      });
    }
  }

  $scope.send = function() {
    if (typeof this.message === 'undefined' || (typeof this.message === 'string' && this.message.length === 0)) {
      $scope.error.send = 'Please enter a message';
    } else {
      if($scope.writeMode == $scope.modes[0]){ // send
        socket.emit('send', {
          name: this.username,
          message: this.message
        });
        $scope.message = '';
        $scope.error.send = '';
      }else if ($scope.writeMode == $scope.modes[1]){
        alert("Will add linking soon");
        $scope.pinnedPosts.push({message : this.message});
      }else if ($scope.writeMode == $scope.modes[2]){
        alert("So is pinning");
        $scope.pinnedPosts.push({message : this.message});
      }else{
        alert("I DONT KNOW ABOUT THIS ONE");
      }
    }

  }

  $scope.createRoom = function() {
    var roomExists = false;
    var room = this.roomname;
    if (typeof room === 'undefined' || (typeof room === 'string' && room.length === 0)) {
      $scope.error.create = 'Please enter a room name';
    } else {
      socket.emit('checkUniqueRoomName', room, function(data) {
        roomExists = data.result;
        if (roomExists) {
          $scope.error.create = 'Room ' + room + ' already exists.';
        } else {
          socket.emit('createRoom', room);
          $scope.error.create = '';
          if (!$scope.user.inroom) {
            $scope.messages = [];
            $scope.roomname = '';
          }
        }
      });
    }
  }

  $scope.contextSwitch = function(room){
  }

  $scope.addedInRoom = function(item){
    return $scope.addedRooms.indexOf(item) < 0;
  }

  $scope.addRoom = function(room){
    $scope.addedRooms.unshift(room);
    var roomTab = $("<li><a href='#currentRoom'>"+room.name.slice(0,8) + " </a></li>");
    var exit = $("<i class='icon-cancel'></i>");
    roomTab.find("a").append(exit);
    roomTab.click(function(){
      $scope.contextSwitch(room);
      $scope.leaveRoom($scope.currentRoom);
      $scope.joinRoom(room);
      $scope.$apply(function(){
        $scope.create=false;
        roomTab.addClass("active");
      });
      
    });
    $("#classtabs").prepend(roomTab).tabcontrol();
  }

  $scope.joinRoom = function(room) {
    $scope.messages = [];
    $scope.error.create = '';
    $scope.message = '';
    socket.emit('joinRoom', room.id);
    $scope.currentRoom = room;
  }

  $scope.leaveRoom = function(room) {
    $scope.message = '';
    if(room != null)
    socket.emit('leaveRoom', room.id);
  }

  $scope.deleteRoom = function(room) {
    $scope.message = '';
    socket.emit('deleteRoom', room.id)
  }

  socket.on('sendUserDetail', function(data) {
    $scope.user = data;
  });

  socket.on('listAvailableChatRooms', function(data) {
    $scope.rooms.length = 0;
    angular.forEach(data, function(room, key) {
      $scope.rooms.push({name: room.name, id: room.id});
    });
  });

  socket.on('sendChatMessage', function(message) {
    $scope.messages.push(message);
  });

  socket.on('sendChatMessageHistory', function(data) {
    angular.forEach(data, function(messages, key) {
      $scope.messages.push(messages);
    });
  });

  socket.on('roomData', function(data){
    console.log(data.room);
    console.log($scope.currentRoom.id);
    console.log(data.room.localeCompare($scope.currentRoom.id))
    if(data.room.localeCompare($scope.currentRoom.id) >= 0){
        $scope.peopleOnline = data.people;
        console.log($scope.peopleOnline);
    }
  })

  socket.on('connectingToSocketServer', function(data) {
    $scope.status = data.status;
  });

  socket.on('usernameExists', function(data) {
    $scope.error.join = data.data;
  });

  socket.on('updateUserDetail', function(data) {
    $scope.users = data;
  });

  socket.on('joinedSuccessfully', function() {
    var payload = {
      countrycode: '',
      device: ''
    };
    geolocation.getLocation().then(function(position) {
      return geolocation.getCountryCode(position);
    }).then(function(countryCode) {
      payload.countrycode = countryCode;
      return useragent.getUserAgent();
    }).then(function(ua) {
      return useragent.getIcon(ua);
    }).then(function(device) {
      payload.device = device;
      socket.emit('userDetails', payload);
    });
  });

  socket.on('updatePeopleCount', function(data) {
    $scope.peopleCount = data.count;
  });

  socket.on('updateRoomsCount', function(data) {
    $scope.roomCount = data.count;
  });

  socket.on('disconnect', function(){
    $scope.status = 'offline';
    $scope.users = 0;
    $scope.peopleCount = 0;
  });
}

