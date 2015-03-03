(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['lodash', 'backbone', 'storage'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('lodash'), require('backbone'), require('storage'));
  } else {
    root.Monaco = factory(root._, root.Backbone, root.localStorage);
  }
}(this, function(_, Backbone, localStorage) {
// expose the main Monaco object
var Monaco = this.Monaco = (this.Monaco || {}),
    utils = Monaco.utils = (Monaco.utils || {});

/* -- UTILITIES -------------------------------------------------------- */
// clone of extend method available on backbone
var extend = function(protoProps, staticProps) {
  var parent = this;
  var child;

  if (protoProps && _.has(protoProps, 'constructor')) {
    child = protoProps.constructor;
  } else {
    child = function(){ return parent.apply(this, arguments); };
  }

  _.extend(child, parent, staticProps);

  var Surrogate = function(){ this.constructor = child; };
  Surrogate.prototype = parent.prototype;
  child.prototype = new Surrogate();

  if (protoProps) {
    _.extend(child.prototype, protoProps);
  }

  child.__super__ = parent.prototype;

  return child;
};

// expose the extend function
utils.extend = extend;

return Monaco;
}));
