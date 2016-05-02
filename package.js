
Package.describe({
  name: "zeroasterisk:throttle",
  summary: "A secure means of rate limiting, debounce even in a cluster (emails, etc)",
  version: "0.3.5",
  git: "https://github.com/zeroasterisk/Meteor-Throttle.git"
});

Package.onUse(function (api) {
  api.versionsFrom("0.9.0");
  api.use(['meteor', 'underscore', 'check'], 'server');
  // Export the object 'Throttle' to packages or apps that use this package.
  api.export('Throttle', 'server');
  api.addFiles('throttle.js', ['server']);
});

Package.onTest(function (api) {
  api.use("zeroasterisk:throttle");
  api.use('tinytest@1.0.0');
  api.addFiles('throttle_tests.js', ['client', 'server']);
});
