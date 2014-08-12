Meteor Throttle
==========================

A Simple (server only) Throttling System for Meteor.

This system uses a new Collection 'throttle' and some helper methods to:
`check`, `set`, and `purge` records.  There is also a helper `checkThenSet`
method which is actually the most common pattern, check if we can do something,
and the set a record that we did.

Example Meteor Application
------------------------

http://throttle-example.meteor.com

https://github.com/zeroasterisk/Meteor-Throttle-Example


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


Usage On Server (direct)
------------------------

_(Use Case)_ If your app is sending emails, you wouldn't want to send the same email over
and over again, even if a user triggered it.

    // on server
    if (!Throttle.checkThenSet(key, allowedCount, expireInMS)) {
      throw new Meteor.Error(500, 'You may only send ' + allowedCount + ' emails at a time, wait a while and try again');
    }
    ....


Functions On the Throttle Collection (server only)
------------------------

* `checkThenSet(key, allowedCount, expireInMS)` checks a key, if passes it then sets the key for future checks
* `check(key, allowedCount)` checks a key, if less than `allowedCount` of the (unexpired) records exist, it passes
* `set(key, expireInMS)` sets a record for key, and it will expire after `expireInMS` milliseconds, eg: `60000` = 1 min in the future
* `purge()` expires all records which are no longer within timeframe (automatically called on every check)


Methods Methods (call-able)
------------------------

* `throttle(key, allowedCount, expireInMS)` --> `Throttle.checkThenSet()`
* `throttle-check(key, allowedCount)` --> `Throttle.check()`
* `throttle-set(key, expireInMS)` --> `Throttle.set()`
* `throttle-debug(bool)` --> pass in true/false to toggle server loggin on checks

