/**
 * Throttle A tool for limiting repeated calls to anything on the server
 * (the choice was made not to allow this on the client, so it's actually secure)
 *
 *
 * Configuration on the Server
 *
 *
 * Throttle.setDebugMode(true/false)
 * Throttle.setScope("user") or "global" [default=global]
 */
if (Meteor.isServer) {

  Throttle = {};

  // have we run setup yet?
  Throttle.isSetup = false;
  // collection name (null for single-node-app, RAM only, no MongoDB)
  Throttle._collectionName = 'throttles';
  // debug mode
  Throttle.debug = false;
  // scope: normal, user
  //   if set to "user" all keys will become user specific not global
  //   (on server, based on Meteor.userId())
  Throttle.scope = 'normal';
  // enable "helper" clientside methods
  Throttle.isMethodhelpersAllowed = true;

  // Access to set the Throttle.debug Boolean
  Throttle.setup = function() {
    if (this.isSetup) {
      return;
    }
    this.isSetup = true;
    if (this._collectionName) {
      this._collection = new Meteor.Collection(this._collectionName);
      this._collection._ensureIndex({key: 1});
      this._collection._ensureIndex({expire: 1});
    } else {
      this._collection = new Meteor.Collection(null);
    }
  };

  // clear existing setup (allowing for changing _collectionName)
  Throttle.resetSetup = function() {
    this.isSetup = false;
  }

  // Access to set the Throttle._collectionName string
  //   see setup()
  Throttle.setCollection = function(name) {
    check(name, Match.OneOf(String, null));
    this._collectionName = name;
    if (this.debug) {
      console.log('Throttle.setCollection(' + name + ')');
    }
    // reset setup() just in case it's already been called
    this.resetSetup();
  }

  // Access to set the Throttle.debug Boolean
  Throttle.setDebugMode = function(bool) {
    check(bool, Boolean);
    this.debug = bool;
    if (this.debug) {
      console.log('Throttle.setDebugMode(' + bool + ')');
    }
  }

  // Access to set the Throttle.debug Boolean
  //   see keyScope()
  Throttle.setScope = function(scope) {
    check(scope, String);
    this.scope = scope;
    if (this.debug) {
      console.log('Throttle.setScope(' + scope + ')');
    }
  }

  // Access to set the Throttle.isMethodhelpersAllowed Boolean
  //   see checkAllowedMethods()
  Throttle.setMethodsAllowed = function(bool) {
    check(bool, Boolean);
    this.isMethodhelpersAllowed = bool;
    if (this.debug) {
      console.log('Throttle.setMethodsAllowed(' + bool + ')');
    }
  }

  // Modify the key based on Throttle.scope
  Throttle.keyScope = function(key) {
    check(key, String);
    if (this.scope == 'user') {
      // we want to append the userId to the key,
      //   so that our Throttling is limited in scope to Meteor.userId()
      //   (accross multiple sessions)
      // if not authenticated, global scope is applied
      var userId = Meteor.userId();
      if (userId) {
        key = key + '_u_' + Meteor.userId();
      }
    }
    return key;
  }

  // check to see if we've done something too many times
  // if we "pass" then go ahead and set... (shortcut)
  Throttle.checkThenSet = function(key, allowed, expireInMS) {
    if (!this.check(key, allowed)) {
      return false;
    }
    return this.set(key, expireInMS)
  };

  // check to see if we've done something too many times
  //   if more than allowed = false
  Throttle.check = function(key, allowed) {
    this.setup();
    Throttle.purge();
    key = Throttle.keyScope(key);
    if (!_.isNumber(allowed)) {
      allowed = 1;
    }
    if (Throttle.debug) {
      console.log('Throttle.check(', key, allowed, ')');
    }
    return (this._collection.find({ key: key }).count() < allowed);
  }

  // create a record with
  Throttle.set = function(key, expireInMS) {
    this.setup();
    key = Throttle.keyScope(key);
    if (!_.isNumber(expireInMS)) {
      expireInMS = 180000; // 3 min, default expire timestamp
    }
    var expireEpoch = this.epoch() + expireInMS;
    if (Throttle.debug) {
      console.log('Throttle.set(', key, expireInMS, ')');
    }
    this._collection.insert({
      key: key,
      expire: expireEpoch
    });
    return true;
  };

  // remove expired records
  Throttle.purge = function() {
    this.setup();
    this._collection.remove({ expire: {$lt: this.epoch() } });
  };

  // simple tool to get a standardized epoch/timestamp
  Throttle.epoch = function() {
    var now = new Date;
    return now.getTime();
  }

  // Rise exception if disabled client-side methods
  //   see setMethodsAllowed()
  Throttle.checkAllowedMethods = function()  {
    if (Throttle.isMethodhelpersAllowed) {
      return true;
    }
    throw new Meteor.Error(403, 'Client-side throttle disabled');
  };

  // expose some methods for easy access into Throttle from the client
  Meteor.methods({
    'throttle': function(key, allowed, expireInMS) {
      Throttle.checkAllowedMethods();
      check(key, String);
      check(allowed, Match.Integer);
      check(expireInMS, Match.Integer);
      return Throttle.checkThenSet(key, allowed, expireInMS);
    },
    'throttle-set': function(key, expireInMS) {
      Throttle.checkAllowedMethods();
      check(key, String);
      check(expireInMS, Match.Integer);
      return Throttle.set(key, expireInMS);
    },
    'throttle-check': function(key, allowed) {
      Throttle.checkAllowedMethods();
      check(key, String);
      check(allowed, Match.Integer);
      return Throttle.check(key, allowed);
    },
    'throttle-debug': function(bool) {
      Throttle.checkAllowedMethods();
      return Throttle.setDebugMode(bool);
    },
  });

}
