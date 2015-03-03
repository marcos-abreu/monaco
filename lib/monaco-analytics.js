(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['lodash', 'backbone', 'storage'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('lodash'), require('backbone'), require('storage'));
  } else {
    root.Monaco = factory(root._, root.Backbone, root.localStorage);
  }
}(this, function(_, Backbone, localStorage) {
/*
 * Overrides backbone navigation system in order to provide page tracking
 * ps: by default it uses Google Analytics
 *     to integrate it with other platforms check the docs.
 */

// make sure monaco is defined as the main object
var Monaco = this.Monaco = (this.Monaco || {});

// keep a reference to the original `loadUrl` method from Monaco
var loadUrl = this.Monaco.History.prototype.loadUrl,
    self = this;

// overridden method to inject a call to track page views
Monaco.History.prototype.loadUrl = function() {
  var matched = loadUrl.apply(this, arguments),
      pvFragment = this.fragment;

  if (!/^\//.test(pvFragment)) {
    pvFragment = '/' + pvFragment;
  }
  this.trackPageview(pvFragment);
  return matched;
};

// Override this method if you are not using google analytics, but
// instead another analytics service to track page views
Monaco.History.prototype.trackPageview = function(fragment) {
  if( self.ga !== void 0 ) {
    self.ga('send', 'pageview', fragment);
  }
};

return Monaco;
}));
