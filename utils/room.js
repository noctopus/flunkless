function Room(name, id, owner, visibility) {
  this.name = name;
  this.id = id;
  this.owner = owner;
  this.people = [];
  this.status = "available";
  this.pubView = visibility == null ? true : visibility;
  this.invitedUsers = [owner];
};

Room.prototype.addPerson = function(personID) {
  if (this.status === "available") {
    this.people.push(personID);
  }
};

module.exports = Room;