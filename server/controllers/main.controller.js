// controller methods for a route

// import
var UserProfile = require('../models/users');
var Events = require('../models/events');
var mongoose = require('mongoose');

// exporting all methods
module.exports = {
  addEvent : addEvent,
  deleteEvent : deleteEvent,
  usersGoingEvent : usersGoingEvent,
  deleteUser : deleteUser,
  getInterestedEvents: getInterestedEvents,
  getUsers: getUsers,
}

// get a list of all users registered
function getUsers(req, res) {
  UserProfile.find({})
  .then(data => {
    res.json(data);
  });
}

// get a list of all events marked interested by users
function getInterestedEvents(req, res) {
  Events.find({})
  .then(data => {
    res.json(data);
  });
}

// delete a currently logged-in user
function deleteUser(req, res) {
  UserProfile.remove({username:req.params.username}, function(err) {
    if (err) {
      console.error(err);
    }
    else {
      req.session.destroy(function() {
          res.json({message:"user deleted"});
      });
    }
  });
}

// get a list of users going to a specific event
function usersGoingEvent(req, res) {
  console.log(req.params.eventID);
  Events.findOne({id:req.params.eventID})
  .then(data => {
    if (data) {
      UserProfile.find({username:{$in:data.interestedUsers}})
      .then(data2 => {
        if (data2) {
          var returnData = [];

          for (i in data2) {
            let username = data2[i].username;
            let description = data2[i].description;
            let goingEvents = data2[i].events;

            returnData.push({username, description, goingEvents});
          }
        res.json({goingUsers:{interestedUsers:returnData}});
        }
      })
      .catch(err => {
        console.error(err);
      });
    }
    else {
      res.json({goingUsers:{interestedUsers:[]}});
    }
  });
}

// add an event to a user's interested events list
function addEvent(req, res) {
  UserProfile.findOne({
    username: req.body.username
  })
  .then(data => {
    if(!data.events.includes(req.body.eventID)) {
      UserProfile.update({
        username: req.body.username
      }, {
        $push: {
          events: req.body.eventID
        }
      },
      function(err, result) {
        if(err) {
          res.status(404);
          res.send(err);
        } else {
          Events.findOne({id:req.body.eventID})
          .then(data => {
            if (data) {
              if (!data.interestedUsers.includes(req.body.username)) {
                Events.update(
                  {id:req.body.eventID},
                  {$push:{interestedUsers:req.body.username}},
                  function(err, result) {
                    if (err) {
                      res.status(404);
                      res.send(err);
                    }
                    else {
                      res.json({message:'added'});
                    }
                  }
                )
              }
              else {
                console.log("duplicated in events");
                res.json({message:'duplicated in events'});
              }
            }
            else {
              var new_event = new Events({id:req.body.eventID, interestedUsers:[req.body.username]});
              new_event.save();
              console.log("added");
              res.json({message:'added'});
            }
          })
        }
      });
    }
    else {
      res.json({message:'duplicate'});
    }
  })
}

// delete an event from a user's interested events list
function deleteEvent(req, res) {
  UserProfile.findOne({
    username: req.params.username
  })
  .then(data => {
    if(data.events.includes(req.params.eventID)) {
      UserProfile.update({
        username: req.params.username
      }, {
        $pull: {
          events: req.params.eventID
        },
      },
      { multi: true },
      function(err, result) {
        if(err) {
          res.status(404);
          res.send(err);
        } else {
          // console.log(result);
          Events.findOne({id:req.params.eventID})
          .then(data => {
            if (data) {
              if (data.interestedUsers.includes(req.params.username)) {
                Events.update(
                  {id:req.params.eventID},
                  {$pull:{interestedUsers:req.params.username}},
                  function(err, result) {
                    if (err) {
                      res.status(404);
                      res.send(err);
                    }
                    else {
                      console.log("deleted");
                      res.json({message:'deleted'});
                    }
                  }
                )
              }
              else {
                console.log("duplicate in events");
                res.json({message:'duplicate in events'});
              }
            }
            else {
              var new_event = new Events({id:req.params.eventID, interestedUsers:[]});
              new_event.save();
              console.log("deleted");
              res.json({message:'deleted'});
            }
          })
        }
      });
    }
    else {
      console.log("wasn't there");
      res.json({message:'the event was not there'});
    }
  });
}
