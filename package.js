Package.describe({
  summary: "\u001b[32mv0.0.1\n"+
  "\u001b[33m-----------------------------------------\n"+
  "\u001b[0m Throttle is a simple means of limiting   \n"+
  "\u001b[0m Serverside interactions (emails, etc)    \n"+
  "\u001b[33m-----------------------------zeroasterisk\n"
});

Package.on_use(function (api) {
  "use strict";
  api.export && api.export('Throttle', 'server');
  api.use(['meteor', 'underscore'], 'server');
  api.use('standard-app-packages', 'server');
  api.add_files('throttle.js', 'server');
});

