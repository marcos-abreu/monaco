(function(window) {
    'use strict';
    var Monaco = window.Monaco = (window.Monaco || {});

    /* -- ROUTER ----------------------------------------------------------- */
    Monaco.Router.prototype = _.extend(Monaco.Router.prototype, {
        // return the regexp option of the specific router if available 
        // otherwhise undefined will be returned
        _routeConstraints : function(route) {
            var value = this._routes[route];
            if (value && _.isArray(value) && value.length > 1 && _.isObject(value[1])) {
                return value[1].regexp;
            }
            return void 0;
        },

        // override the original Backbone method to deal with the regex constraints
        _routeToRegExp : function(route)
            var constraints = this._routeConstraints(route);
            route = route.replace(escapeRegExp, '\\$&')
                         .replace(optionalParam, '(?:$1)?')
                         .replace(namedParam, function(match, optional){
                            // this `if` is the only difference from the original method from Backbone
                            // todo: find a way of getting the route regexp constranits
                            if (constraints && constraints[match.substr(1)]) {
                                var reStr = constraints[match.substr(1)].toString();
                                return reStr.slice(1, reStr.lastIndexOf('/'));
                            }
                            return optional ? match : '([^\/]+)';
                         })
                         .replace(splatParam, '(.*?)');
            return new RegExp('^' + route + '$');
        },

        // internal list of filters
        _filters : [],

        // adds a filter method to list of filters
        addFilter : function(name, callback) {
            var filter = {};
            filter[name] = callback;
            // todo: verify if the filter already exists on the array and throw an error
            this._filters.push(filter);
        },

        // wraps one or more controllers into one or more filters
        // use this method to execute post processing and pre processing code
        applyFilter: function(filters, controllers) {
            var originalController;

            // wrapp each controller with the list of filters provided
            for (var i = 0, l = controllers.length; i < l; i++) {
                for (var a=0, b=filters.length; a < b; a++) {
                    originalController = this.prototype[controllers[i]];
                    this.prototype[controllers[i]] = function() {
                        return this.prototype._filters[filters[a]].call(this, originalController, arguments);
                    }
                }
            }
        },

        // returns the original route definition based on the url name informed
        _getByName: function(name) {
            var possibleRoutes = _.map(this._routes, function(options, route) {
                if (_.isArray(options) && options.length > 1) {
                    if ((_.isString(options[1]) && options[1] === name) ||
                        (_.isObject(options[1]) && options.name === name)) {
                        return route;
                    }
                }
                return null;
            });

            route = _.compact(possibleRoutes);
            if (route.length > 0) {
                return route[0];
            }
            return false;
        },

        // returns a reverse url based on the url name and parameters passed to it. 
        // This url won't be validated against the regexp contrains even if available.
        // Neighter it will validate if you provided enough parameters, the missing
        // parameters will be displayed as the original url definition.
        reverse: function(name, params) {
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
        }
    };
}(window));