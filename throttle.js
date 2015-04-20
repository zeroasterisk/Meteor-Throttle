/**
 * Throttle A tool for limiting repeated calls to anything on the server
 * (the choice was made not to allow this on the client, so it's actually secure)
 *
 */
if (Meteor.isServer) {

  Throttle = new Meteor.Collection('throttles');
  Throttle._ensureIndex({key: 1});
  Throttle.debug = true;

  // check to see if we've done something too many times
  // if we "pass" then go ahead and set... (shortcut)
  Throttle.checkThenSet = function(key, allowed, expireInMS) {
    if (!this.check(key, allowed)) {
      return false;
    }
    return this.set(key, expireInMS)
  };

  // check to see if we've done something too many times
  Throttle.check = function(key, allowed) {
    Throttle.purge();
    if (!_.isNumber(allowed)) {
      allowed = 1;
    }
    if (Throttle.debug) {
      console.log('Throttle.check(', key, allowed, ')');
    }
    return (this.find({ key: key }).count() < allowed);
  }

  // create a record with
  Throttle.set = function(key, expireInMS) {
    if (!_.isNumber(expireInMS)) {
      expireInMS = 180000; // 3 min, default expire timestamp
    }
    var expireEpoch = this.epoch() + expireInMS;
    if (Throttle.debug) {
      console.log('Throttle.set(', key, expireInMS, ')');
    }
    this.insert({
      key: key,
      expire: expireEpoch
    });
    return true;
  };

  // remove expired records
  Throttle.purge = function() {
    this.remove({ expire: {$lt: this.epoch() } });
  };

  // simple tool to get a standardized epoch/timestamp
  Throttle.epoch = function() {
    var now = new Date;
    return now.getTime();
  }

  // expose some methods for easy access into Throttle from the client
  Meteor.methods({
    'throttle': function(key, allowed, expireInMS) {
      check(key, String);
      check(allowed, Match.Integer);
      check(expireInMS, Match.Integer);
      return Throttle.checkThenSet(key, allowed, expireInMS);
    },
    'throttle-set': function(key, expireInMS) {
      check(key, String);
      check(expireInMS, Match.Integer);
      return Throttle.set(key, expireInMS);
    },
    'throttle-check': function(key, allowed) {
      check(key, String);
      check(allowed, Match.Integer);
      return Throttle.check(key, allowed);
    },
    'throttle-debug': function(bool) {
      check(bool, Boolean);
      return Throttle.debug = bool;
    },
  });

}
