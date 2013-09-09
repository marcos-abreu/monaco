// override Backbone loadURL to track page loads on history.navigate calls
(function(window, _, Backbone) {
    'use strict';

    // keep a reference to the original `loadUrl` method from Monaco
    var loadUrl = window.Monaco.History.prototype.loadUrl;

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
        if( window.ga !== void 0 ) {
            window.ga('send', 'pageview', fragment);
        }
    };
}(window, window._, window.Backbone));
