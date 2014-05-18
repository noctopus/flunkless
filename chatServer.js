module.exports = function(server) {
  var uuid = require('node-uuid')
  _ = require('underscore')._
  , Room = require('./utils/room')
  , Person = require("./utils/person")
  , people = {}
  , rooms = {}
  , chatHistory = {}
  , roomPosts = {}
  , io = require('socket.io').listen(server)
  , utils = require('./utils/utils')
  , purgatory = require('./utils/purge');
  io.set('log level', 1);
var classes = require("./classes.json")
classes.forEach(function(elm){
    var uniqueRoomID = uuid.v4() //guarantees uniquness of room
    rooms[uniqueRoomID] = new Room(elm.name, uniqueRoomID, null, true);
    rooms[uniqueRoomID].setCategory(elm.group);
});


function listAvailableRooms(socket, rooms){
  var newrooms = {};
  for(var i in rooms){
    if(rooms[i].pubView || rooms[i].invitedUsers.indexOf(socket.id)>= 0){
      newrooms[i] = rooms[i];
    }
  }
  return newrooms;
}
function createRoom(data, visibility){
  var roomName = data;
  if (roomName.length !== 0) {
    var uniqueRoomID = uuid.v4() //guarantees uniquness of room
    , room = new Room(roomName, uniqueRoomID, socket.id, visibility);
    rooms[uniqueRoomID] = room;
   utils.sendToAllConnectedClients(io,'listAvailableChatRooms', listAvailableRooms(socket,rooms));
  }
}

  io.sockets.on('connection', function (socket) {

    socket.on('joinServer', function(data) {
      var exists = false;
      _.find(people, function(k, v) {
        if (k.name.toLowerCase() === data.name.toLowerCase())
          return exists = true;
      });

      if (!exists) {
        if (data.name.length !== 0) {
          var user = new Person(data.name, socket.id);
          people[socket.id] = user;
          utils.sendToSelf(socket,'listAvailableChatRooms', listAvailableRooms(socket,rooms));
        }
      }
    });

    socket.on('createRoom', function(data) {
      var exists = false;
      _.find(rooms, function(k, v) {
        if (k.name.toLowerCase() === data.toLowerCase())
        return exists = true;
      });
      if (!exists) {
        createRoom(data, false);
      }
    });

    socket.on('joinRoom', function(id) {
    if (typeof people[socket.id] !== 'undefined') {
      var roomToJoin = rooms[id];
      socket.join(roomToJoin.id); // joins actual room
      roomToJoin.addPerson(people[socket.id]); // adds pointer to person from room
      people[socket.id].addRoom(roomToJoin); // adds pointer to room from person
      var peopleIn = roomToJoin.getListOfPeople();
      utils.sendToAllConnectedClients(io, 'roomData', {room : id, people : peopleIn})
      utils.sendToSelf(socket, 'roomPosts',
        {
            room : id, 
            posts : roomToJoin.posts,
            pinnedPosts : roomToJoin.pinnedPosts
        });
      }
    });

 socket.on('leaveRoom', function(id) {
    if (typeof people[socket.id] !== 'undefined') {
      var roomToJoin = rooms[id];
      socket.leave(roomToJoin.id); // joins actual room
      roomToJoin.removePerson(people[socket.id]); // adds pointer to person from room
      delete people[socket.id];
      var peopleIn = roomToJoin.getListOfPeople();
      utils.sendToAllConnectedClients(io, 'roomData', {room : id, people : peopleIn})
      utils.sendToSelf(socket, 'roomPosts',
        {
            room : id, 
            posts : roomToJoin.posts,
            pinnedPosts : roomToJoin.pinnedPosts
        });
      }
    });

    socket.on('send', function(data) {
      if(rooms[data.roomid] == null){
        return;
      }
     
      if(data.type=='message'){
          rooms[data.roomid].addPost(data)
      }else{
          rooms[data.roomid].pinPost(data)
    }
      console.log(rooms[data.roomid]);
      utils.sendToAllClientsInRoom(io,  data.roomid, 'roomPosts',
        {
            room : data.roomid,
            posts : rooms[data.roomid].posts,
            pinnedPosts : rooms[data.roomid].pinnedPosts
        });
  });

  socket.on('disconnect', function() {
    if(people[socket.id] != null){
        var user = people[socket.id];
        user.rooms.forEach(function(e){
          rooms[e].removePerson(user.name);
          utils.sendToAllConnectedClients(io, 'roomData', {room : rooms[e].id, people : rooms[e].getListOfPeople()})
        }); 
        delete people[socket.id];
        utils.sendToAllConnectedClients(io,'listAvailableChatRooms', listAvailableRooms(socket,rooms));
      }
  });


  socket.on('checkUniqueUsername', function(username, cb) {
    var exists = false;
    if (username.length !== 0) {
      _.find(people, function(k, v) {
      if (k.name.toLowerCase() === username) {
        return exists = true;
        }
      });
      cb({result: exists});
    }
  });

    socket.on('checkUniqueRoomName', function(roomname, cb) {
      var exists = false;
      if (roomname.length !== 0) {
        _.find(rooms, function(k, v) {
          if (k.name.toLowerCase() === roomname) {
            return exists = true;
          }
        });
        cb({result: exists});
      }
    });

    socket.on('suggest', function(username, cb) {
      var random = Math.floor(Math.random()*1001);
      var suggestedUsername = username + random;
      cb({suggestedUsername: suggestedUsername});
    });
  });
}