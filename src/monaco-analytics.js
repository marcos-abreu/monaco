// override Backbone loadURL to track page loads on history.navigate calls
(function(window) {
    'use strict';

    var loadUrl = window.Backbone.History.prototype.loadUrl;

    // overriden method to inject a call to track page views
    Backbone.History.prototype.loadUrl = function() {
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
    Backbone.History.prototype.trackPageview = function(fragment) {
        if( window.ga !== void 0 ) {
            window.ga('send', 'pageview', fragment);
        }
    }
}(window));
