Meteor Throttle
==========================

A Simple (server only) Throttling System for Meteor.

This system uses a new Collection 'throttle' and some helper methods to:
`check`, `set`, and `purge` records.  There is also a helper `checkThenSet`
method which is actually the most common pattern, check if we can do something,
and the set a record that we did.

Usage
------------------------

_(Use Case)_ If your app is sending emails, you wouldn't want to send the same email over
and over again, even if a user triggered it.

    // on server
    if (!Throttle.checkThenSet(key, allowedCount, expireInSec)) {
      throw new Meteor.Error(500, 'You may only send ' + allowedCount + ' emails at a time, wait a while and try again');
    }
    ....

On Throttle Methods
------------------------

* `checkThenSet(key, allowedCount, expireInSec)` checks a key, if passes it then sets the key for future checks
* `check(key, allowedCount)` checks a key, if less than `allowedCount` of the (unexpired) records exist, it passes
* `set(key, expireInSec)` sets a record for key, and it will expire after `expireInSec` milliseconds, eg: `60000` = 1 min in the future
* `purge()` expires all records which are no longer within timeframe (automatically called on every check)


Methods Methods (call-able)
------------------------

* `throttle(key, allowedCount, expireInSec)` --> `Throttle.checkThenSet()`
* `throttle-check(key, allowedCount)` --> `Throttle.check()`
* `throttle-set(key, expireInSec)` --> `Throttle.set()`

