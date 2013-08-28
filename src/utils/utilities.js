(function(window) {
    'use strict';

    // Certain Android devices are having issues when a JSON.parse(null) call is executed.
    // the following should fix this bug
    JSON.originalParse = JSON.parse;
    JSON.parse = function(text) {
        if (text) {
            return JSON.originalParse(text);
        }
        return null;
    };
}(window));