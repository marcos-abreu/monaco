(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['lodash', 'backbone', 'storage'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('lodash'), require('backbone'), require('storage'));
  } else {
    root.Monaco = factory(root._, root.Backbone, root.localStorage);
  }
}(this, function(_, Backbone, localStorage) {
// Certain Android devices are having issues when a JSON.parse(null) call is executed.
// the following should fix this bug

var parse = JSON.parse;
JSON.parse = function(text) {
  if (text) {
    return parse(text);
  }
  return null;
};

return Monaco;
}));
