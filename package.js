Package.describe({
  summary: "\u001b[32mv0.1.0\n"+
  "\u001b[33m-----------------------------------------\n"+
  "\u001b[0m Throttle is a simple means of limiting   \n"+
  "\u001b[0m Serverside interactions (emails, etc)    \n"+
  "\u001b[33m-----------------------------zeroasterisk\n"
});

Package.on_use(function (api, where) {
  api.use(['meteor', 'underscore'], 'server');
  api.add_files('throttle.js', ['server']);
});

Package.on_test(function (api) {
  api.use('throttle');
  api.add_files('throttle_tests.js', ['client', 'server']);
});
