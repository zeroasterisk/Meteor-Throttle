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

  // CONFIG
  // collection name
  //   You can set to null for single-node-app, RAM only, no MongoDB
  //   Want more customization?  see: setCollection()
  Throttle._collectionName = 'throttles';
  // collection options
  Throttle._collectionOptions = {};
  // debug mode
  Throttle.debug = false;
  // scope: normal, user
  //   if set to "user" all keys will become user specific not global
  //   (on server, based on Meteor.userId())
  Throttle.scope = 'normal';
  // enable "helper" clientside methods
  Throttle.isMethodhelpersAllowed = true;
  // PLACEHOLDERS
  // collection object placeholder
  Throttle._collection = null;
  // have we run setup yet?
  Throttle.isSetup = false;

  // Setup the Throttle Collection (or re-setup)
  //   called automatically when collection is used
  //   if you have to re-setup, call resetSetup() first
  //   see also: setCollection(), setCollectionName(), getCollection()
  Throttle.setup = function() {
    if (this.isSetup && this._collection) {
      return;
    }
    this.isSetup = true;
    if (!this._collectionName) {
      // no collectionName = no mongo, RAM only
      //   NOTE that null (RAM ONLY) will not work on a multi-app setup
      //   Also note that this may not be faster because it is non-indexed
      //     (depending on your usage)
      this._collection = new Mongo.Collection(null, this._collectionOptions);
      return;
    }
    // MongoDB collection
    //   want something else, or more configuration options?
    //   no problem... see Throttle.setCollection()
    //   and use it before anything else uses Throttle.
    this._collection = new Mongo.Collection(
      this._collectionName,
      this._collectionOptions
    );
    this._collection._ensureIndex({key: 1});
    this._collection._ensureIndex({expire: 1});
  };

  // clear existing setup (allowing for changing _collectionName)
  Throttle.resetSetup = function() {
    delete Throttle._collection;
    Throttle._collection = null;
    this.isSetup = false;
  };

  // Access to get the Throttle._collection object - it's a Meteor.Collection()
  //   see setup(), setCollection()
  Throttle.getCollection = function() {
    this.setup();
    return this._collection;
  };

  // Access to set the Throttle._collectionName string
  //   see setup(), resetSetup(), setCollectionName(), getCollection()
  Throttle.setCollection = function(input) {
    if (typeof input === "string" || typeof input === "null") {
      // assume this is _collectionName setting
      return this.setCollectionName(input);
    }
    // assume this is _collection (the full collection object)
    if (this.debug) {
      console.log('Throttle.setCollection([object]) new collection set');
    }
    this._collection = input;
    this.isSetup = true;
  };

  // Access to set the Throttle._collectionName string
  //   see setup(), resetSetup(), setCollection(), getCollection()
  Throttle.setCollectionName = function(name) {
    check(name, Match.OneOf(String, null));
    this._collectionName = name;
    console.log('*** Throttle DEPRECATION NOTICE ***');
    console.log('  Throttle.setCollectionName(' + name + ') reset called after');
    console.log('    Future versions of Throttle will omit setCollectionName()');
    console.log('    If you want to customize the collection, instead use setCollection()');
    console.log('    Or you can manually set the Throttle._collectionName before setup, on server');
    console.log('^^^ Throttle DEPRECATION NOTICE ^^^');
    // reset setup() just in case it's already been called
    this.resetSetup();
  };

  // Access to set the Throttle.debug Boolean
  Throttle.setDebugMode = function(bool) {
    check(bool, Boolean);
    this.debug = bool;
    if (this.debug) {
      console.log('Throttle.setDebugMode(' + bool + ')');
    }
  };

  // Access to set the Throttle.debug Boolean
  //   see keyScope()
  Throttle.setScope = function(scope) {
    check(scope, String);
    this.scope = scope;
    if (this.debug) {
      console.log('Throttle.setScope(' + scope + ')');
    }
  };

  // Access to set the Throttle.isMethodhelpersAllowed Boolean
  //   see checkAllowedMethods()
  Throttle.setMethodsAllowed = function(bool) {
    check(bool, Boolean);
    this.isMethodhelpersAllowed = bool;
    if (this.debug) {
      console.log('Throttle.setMethodsAllowed(' + bool + ')');
    }
  };

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
  };

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
  };

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
  };

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
      throw new Meteor.Error(403, 'Client-side throttle-set disabled as insecure');
      /*
       * Disabled as insecure
       *   if you want this functionality, create your own method
       *   (which is more secure anyway)
       * https://github.com/zeroasterisk/Meteor-Throttle/issues/13
       *
      return Throttle.set(key, expireInMS);
      */
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
