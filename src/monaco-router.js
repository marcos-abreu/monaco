(function(window, _, Backbone) {
    'use strict';
    var Monaco = window.Monaco = (window.Monaco || {});

    /* -- ROUTER ----------------------------------------------------------- */
    // Cached regular expressions for matching named param parts and splatted
    // parts of route strings.
    var optionalParam = /\((.*?)\)/g;
    var namedParam    = /(\(\?)?:\w+/g;
    var splatParam    = /\*\w+/g;
    var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

    // return the regexp option of the specific router if available
    // otherwise undefined will be returned
    Monaco.Router.prototype._routeConstraints = function(routeKey) {
        // var value = this._routes[route];
        var route = _.find(this._routes, function(route) {
            return route.key === routeKey;
        });
        if (route && route.value && _.isArray(route.value) && route.value.length > 1 && _.isObject(route.value[1])) {
            return route.value[1].regexp;
        }
        return void 0;
    };

    // override the original Backbone method to deal with the regex constraints
    Monaco.Router.prototype._routeToRegExp = function(route) {
        var constraints = this._routeConstraints(route);
        route = route.replace(escapeRegExp, '\\$&')
                     .replace(optionalParam, '(?:$1)?')
                     .replace(namedParam, function(match, optional){
                        // this `if` is the only difference from the original method from Backbone
                        if (constraints && constraints[match.substr(1)]) {
                            var reStr = constraints[match.substr(1)].toString();
                            return '(' + reStr.slice(1, reStr.lastIndexOf('/')) + ')';
                        }
                        return optional ? match : '([^\/]+)';
                     })
                     .replace(splatParam, '(.*?)');
        return new RegExp('^' + route + '$');
    };

    Monaco.Router.prototype.filter = function(filters, controller) {
        for (var i = (filters.length - 1) , l = 0; i >= l; i-- ) {
            var next = controller;
            controller = this._wrapFilter(filters[i], next);
        }

        return controller;
    };

    // internal list of filters
    Monaco.Router.prototype._filters = {};

    Monaco.Router.prototype._wrapFilter = function(filter, next) {
        return _.bind(function() {
            this._filters[filter].call(this, next, arguments);
        }, this);
    };

    // adds a filter method to list of filters
    Monaco.Router.prototype.addFilter = function(name, callback) {
        if (this._filters[name]) {
            throw new Error('This filter already exists: ' + name);
        }
        this._filters[name] = callback;
    };

    // returns the original route definition based on the url name informed
    Monaco.Router.prototype._getByName = function(name) {
        var possibleRoutes = _.map(this._routes, function(options, route) {
            if (_.isArray(options) && options.length > 1) {
                if ((_.isString(options[1]) && options[1] === name) ||
                    (_.isObject(options[1]) && options.name === name)) {
                    return route;
                }
            }
            return null;
        });

        var route = _.compact(possibleRoutes);
        if (route.length > 0) {
            return route[0];
        }
        return false;
    };

    // returns a reverse url based on the url name and parameters passed to it.
    // This url won't be validated against the regexp constraints even if available.
    // Neither it will validate if you provided enough parameters, the missing
    // parameters will be displayed as the original url definition.
    Monaco.Router.prototype.reverse = function(name, params) {
        var url = '';
        params = params || {};
        if (!name) {
            throw new Error('required `name` parameter for `reverse` method');
        }

        url = this._getByName(name);
        _.each(params, function(value, key) {
            url = url.replace(':'+key, value);
        });

        return url;
    };
}(window, window._, window.Backbone));
