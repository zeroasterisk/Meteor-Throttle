Meteor Throttle
==========================

A Simple (server only) Throttling System for Meteor.

This system uses a new Collection 'throttle' and some helper methods to:
`check`, `set`, and `purge` records.  There is also a helper `checkThenSet`
method which is actually the most common pattern, check if we can do something,
and the set a record that we did.

Example Meteor Application
------------------------

* https://github.com/zeroasterisk/Meteor-Throttle-Example
 * http://throttle-example.meteor.com
* https://github.com/zeroasterisk/Meteor-Throttle-Accounts
 * (see above Example Meteor application, includes Throttle Accounts)

Install
------------------------

Simple package [Atmosphere Package](https://atmospherejs.com/zeroasterisk/throttle) install is all you need:

    meteor add zeroasterisk:throttle

Optionally add an [Accounts Throttling](https://atmospherejs.com/zeroasterisk/throttle-accounts) "extra" if you want:

    meteor add zeroasterisk:throttle-accounts

*(NOTE for Throttle Accounts, you have to Configure it, see that package's README)*

Usage On Client (Meteor.call)
------------------------

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

Usage On Server (direct)
------------------------

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


Functions On the Throttle Collection (server only)
------------------------

* `checkThenSet(key, allowedCount, expireInMS)` checks a key, if passes it then sets the key for future checks
* `check(key, allowedCount)` checks a key, if less than `allowedCount` of the (unexpired) records exist, it passes
* `set(key, expireInMS)` sets a record for key, and it will expire after `expireInMS` milliseconds, eg: `60000` = 1 min in the future
* `purge()` expires all records which are no longer within timeframe (automatically called on every check)
* `setDebugMode(bool)` true/false logs details [false by default]


Methods Methods (call-able)
------------------------

* `throttle(key, allowedCount, expireInMS)` --> `Throttle.checkThenSet()`
* `throttle-check(key, allowedCount)` --> `Throttle.check()`
* `throttle-set(key, expireInMS)` --> `Throttle.set()`
* `throttle-debug(bool)` --> pass in true/false to toggle server loggin on checks

