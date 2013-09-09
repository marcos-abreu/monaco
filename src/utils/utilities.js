(function(window, _) {
    'use strict';

    // Certain Android devices are having issues when a JSON.parse(null) call is executed.
    // the following should fix this bug

    var parse = JSON.parse;
    JSON.parse = function(text) {
        if (text) {
            return parse(text);
        }
        return null;
    };
}(window, window._));
