# Meteor Throttle

A Simple (server only) Throttling System for Meteor.

This system uses a new Collection 'throttle' and some helper methods to:
`check`, `set`, and `purge` records.  There is also a helper `checkThenSet`
method which is actually the most common pattern, check if we can do something,
and the set a record that we did.

* http://throttle-example.meteor.com
 * [https://github.com/zeroasterisk/Meteor-Throttle-Example](https://github.com/zeroasterisk/Meteor-Throttle-Example)
* main *throttle* package
 * [https://github.com/zeroasterisk/Meteor-Throttle](https://github.com/zeroasterisk/Meteor-Throttle)
 * [Atmosphere Package](https://atmospherejs.com/zeroasterisk/throttle)
* additiional *throttle* package
 * [https://github.com/zeroasterisk/Meteor-Throttle-Accounts](https://github.com/zeroasterisk/Meteor-Throttle-Accounts)
 * [Atmosphere Package](https://atmospherejs.com/zeroasterisk/throttle-accounts)

## Install

Simple package [Atmosphere Package](https://atmospherejs.com/zeroasterisk/throttle) install is all you need:

    meteor add zeroasterisk:throttle

Optionally add an [Accounts Throttling](https://atmospherejs.com/zeroasterisk/throttle-accounts) "extra" if you want:

    meteor add zeroasterisk:throttle-accounts

*(NOTE for Throttle Accounts, you have to Configure it, see that package's README)*

## Configuration

This is optional Configuration - if you want to change how Throttle operates.

```js
    if (Meteor.isServer) {

      // core Throttle config
      // ----------------------------

      // Set a MongoDB collection: name, options, or Collection
      //   you can set this to your own 'throttle_collection_name' if you need to
      //   for a multi-node app you MUST use MongoDB (or other shared DB)
      //   for a single-node app you may want to set null, NodeJS RAM only (no MongoDB)
      //     but for some workloads it may NOT be faster than MongoDB, because it is not indexed
      //       You will have to profile for yourself to see which is faster...
      //     https://github.com/zeroasterisk/Meteor-Throttle/pull/10 (see profiling, thanks @osv)
      //   Want more customization?  see: setCollection()
      Throttle.setCollectionName("my_throts"); // default = 'throttles'
      // Throttle.setCollectionName(null);     // RAM only, no DB, not for multi-node apps
      // Throttle.setCollection(new Mongo.Collection("customForWhat")); // full control over Collection
      // Throttle.setup();                     // verify Collection is set up (automatic, no need to manually call)
      // Throttle.resetSetup();                // if you need to change collection after setup()
      // Throttle.getCollection()._createCappedCollection(numBytes); // access to already setup Collection

      // Set the "scope" to "user specific" so every key gets appended w/ userId
      Throttle.setScope("user");          // default = global

      // Show debug messages in the server console.log()
      Throttle.setDebugMode(true);        // default = false

      // Disable client-side methods (event more secure)
      Throttle.setMethodsAllowed(false);  // default = true
    }
```

## Usage On Client (Meteor.call)

NOTE: These will not work if you have set: `Throttle.setMethodsAllowed(false);`

You can easily use the built in methods for throttle checking from the
Client... but to keep Throttling secure we only run it on the server...
therefore you must use the `Meteor.call()` function...

    Meteor.call('throttle', 'mykey', 1, 3000, function(error, result) {
      if (!result) {
        console.error('Not Allowed past Throttle check');
        return;
      }
      console.log('Allowed past Throttle check');
    });

*NOTE that the key (`mykey` in the above example) is insecure on the client... a user could modify their method call to use a different key and bypass Throttling.  If you want **real** security, do all of your throttling on the server, and custom methods to call.*

## Usage On Server (direct)

_(Use Case)_ If your app is sending emails, you wouldn't want to send the same email over
and over again, even if a user triggered it.

    // on server
    if (!Throttle.checkThenSet(key, allowedCount, expireInMS)) {
      throw new Meteor.Error(500, 'You may only send ' + allowedCount + ' emails at a time, wait a while and try again');
    }
    // Secure per-user Throttling available on the server - since we can trust the userId()
    key = key + 'userId' + Meteor.userId();
    if (!Throttle.checkThenSet(key, allowedCount, expireInMS)) {
      throw new Meteor.Error(500, 'Nope - not allowed - try again in a few minutes');
    }
    ....


## Functions On the Throttle Object (server only)

* `checkThenSet(key, allowedCount, expireInMS)` checks a key, if passes it then sets the key for future checks
* `check(key, allowedCount)` checks a key, if less than `allowedCount` of the (unexpired) records exist, it passes
* `set(key, expireInMS)` sets a record for key, and it will expire after `expireInMS` milliseconds, eg: `60000` = 1 min in the future
* `purge()` expires all records which are no longer within timeframe (automatically called on every check)
* `setCollectionName(mixed)` null for no MongoDB, string for MongoDB collection name ['throttles' by default]
* `setCollection(new Mongo.Collection('abc', {}))` set anything you want for the collection
* `getCollection()` returns the collection (after setup) for manipulation
* `setScope(bool)` true/false logs details [false by default]
* `setMethodsAllowed(bool)` true/false allows clientside helper methods [true by default]
* `setDebugMode(bool)` true/false logs details [false by default]
* `resetSetup()` re-setup the Collection, if needed (automatic if `setCollection()` is used)


## Methods Methods (call-able)

* `throttle(key, allowedCount, expireInMS)` --> `Throttle.checkThenSet()`
* `throttle-check(key, allowedCount)` --> `Throttle.check()`
* `throttle-set(key, expireInMS)` --> `Throttle.set()`
* `throttle-debug(bool)` --> pass in true/false to toggle server loggin on checks

If you don't planning to use methods, better if you disable it:

```js
if (Meteor.isServer) {
  Throttle.setMethodsAllowed(false);
}
```

*(no set-scope method, because that would be insecure)*

