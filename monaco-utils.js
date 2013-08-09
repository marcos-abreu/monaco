(function(window) {
    // expose the main Monaco object
    var Monaco = window.Monaco = (window.Monaco || {}),
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

        if (protoProps) _.extend(child.prototype, protoProps);

        child.__super__ = parent.prototype;

        return child;
    };

    // Certain Android devices are having issues when a JSON.parse(null) call is executed.
    // the following should fix this bug
    JSON.originalParse = JSON.parse;
    JSON.parse = function(text) {
        if (text) {
            return JSON.originalParse(text);
        }
        return null;
    };

    // expose the extend function
    utils.extend = extend;
}(window));