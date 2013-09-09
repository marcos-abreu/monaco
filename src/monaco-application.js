(function(window, _, Backbone){
    'use strict';

    var Monaco = window.Monaco = (window.Monaco || {});

    /* -- APPLICATION ------------------------------------------------------ */
    var App = Monaco.Application = function(appName, options) {
        if (!appName) {
            throw new Error('required application parameter: appName');
        }

        options = options || {};

        // Application Unique Name
        this.name = appName;
        this.options = options;

        // Application Client Id
        this.cid = _.uniqueId('app');

        this._settings      = {}; // used internally to store app settings ( get/set )
        this.models         = {}; // initialize model namespace
        this.collections    = {}; // initialize collection namespace
        this.views          = {}; // initialize view namespace

        // create a router instance
        var RouterClass = options.RouterClass || Monaco.Router;
        this.router = new RouterClass({ routes: options.routes });

        // trigger a global envent for application module setup
        Monaco.trigger('app:built', this, options);
    };

    _.extend(App.prototype, Backbone.Events, {
        // Start the Monaco application
        start : function(options) {
            options = options || {};
            options.pushState = options.pushState || false;

            // when starting the application an instance of a router should exist
            if (!_.has(this, 'router')) {
                throw new Error('missing router instance');
            }
            
            // Add all unregistered routes before starting the history
            this.router._addRoutes();

            Monaco.history.start({pushState: options.pushState});

            // trigger a custom event after the application has started
            this.trigger('started', this);
        },

        // Interface used to add objects (models, collections, views and transitions) to your application
        add : function(className, object) {
            // all objects added through this method needs a namespance
            if (!object.prototype || !object.prototype.namespace) {
                throw new Error('missing required object property \'namespace\'');
            }

            // fail on duplicated objects being created on the same namespace
            if (this[object.prototype.namespace][className]) {
                throw new Error(className + ' have already been defined in ' + this.name + '.' + object.prototype.namespace);
            }

            // injects the app reference in the object prototype
            object.prototype._app = this;

            // adds the object using the proper namespacing
            this[object.prototype.namespace][className] = object;
        },

        // App setting get method, returning undefined if not found or any error occours
        // todo: return null instead of undefined to comply with the localStorage api
        get : function(key) {
            // searchs for the key in memory
            if (_.has(this._settings, key)) {
                return this._settings[key];
            }

            // searchs for the key in local storage
            var result = null;
            try {
                result = JSON.parse(window.localStorage.getItem(key));
            } catch( e ) {
                return void 0;
            }

            if (result === null) {
                return void 0;
            }

            // store the key/value in memory
            this._settings[key] = result;

            // return the value
            return result;
        },

        // App setting set method
        set : function(key, value, persist) {
            persist = persist || false;
            // validation
            if (key === void 0 || value === void 0) {
                throw new Error('set method required both key and value parameters');
            }

            // if persist is set to true then store the key/value in localStorage
            if (persist === true) {
                try {
                    window.localStorage.setItem(key, JSON.stringify(value));
                } catch(e) {
                    // console.log( 'Warning: fail to persist key: ' + key );
                    return false;
                }
            }

            // store the key/value in memory
            this._settings[key] = value;
        }
    });

    // Allow the `Monaco` object to serve as a global event bus
    _.extend(Monaco, Backbone.Events);

    // wraps the error callback to trigger the proper events
    var fetchError = function(options) {
        options = options || {};

        var error = options.error,
            router = ( this._app & this._app.router ) ? this._app.router : null;

        // custom error method that will trigger a custom event before executing 
        // the error callback
        options.error = function(obj, resp, options) {
            if (router) {
                router.trigger('route:fetch.error', obj, resp, options);
            }
            if (error) {
                error.apply(this, arguments);
            }
        };
        return options;
    };

    /* -- COLLECTION ------------------------------------------------------- */
    Monaco.Collection = Backbone.Collection.extend({
        // application collection namespace
        namespace : 'collections',

        // override the fetch metod to add the default error router
        fetch : function(options) {
            options = fetchError.call(this, options);
            return Backbone.Collection.prototype.fetch.call(this, options);
        }
    });

    /* -- MODEL ------------------------------------------------------------ */
    Monaco.Model = Backbone.Model.extend({
        // application model namespace
        namespace : 'models',

        // override the fetch metod to add the default error router
        fetch : function(options) {
            options = fetchError.call(this, options);
            return Backbone.Model.prototype.fetch.call(this, options);
        }
    });

    /* -- VIEW ------------------------------------------------------------- */
    Monaco.View = Backbone.View.extend({
        // application view namespace
        namespace : 'views'
    });
      

    /* -- ROUTER ----------------------------------------------------------- */
    Monaco.Router = Backbone.Router.extend({
        // undefined routes
        _uroutes : [],

        // defined routes
        _routes : [],

        // override the Backbone Router constructor
        constructor : function() {
            var initialize = this.initialize; // keep the original initialize method
            // wrap the initialize method to store each route definition
            this.initialize = function(options) {
                _.each(options.routes, function(options, route) {
                    this._routes.push({key: route, value: options});
                }, this);
                initialize.apply(this, arguments);
            };
            Backbone.Router.prototype.constructor.apply(this, arguments);
        },

        // stores routes that will be added when the application starts
        add : function(routes) {
            var route, routeList;
            if (!routes || !_.isObject(routes)) {
                throw new Error('invalid routes format - please check the docs');
            }
            routeList = _.keys(routes);

            while ((route = routeList.pop()) != null) {
                this._uroutes.unshift({key: route, value: routes[route]});
            }
        },

        // adds all undefined routes into Backbone.Router
        _addRoutes : function() {
            var route;
            while((route = this._uroutes.pop()) != null) {
                // this needs to be added to the _route list before the route gest added to the Router.
                this._routes.push(route);
                this._addRoute(route.key, route.value);
            }
        },
        
        // adds one route into Backbone.Router
        _addRoute : function(route, options) {
            options = options || {};

            if (route !== '' && !route) {
                throw new Error('invalid route: ' + route);
            }

            var callback = null;
                // name = null; // todo: verify if it should be null or empty string

            if (_.isString(options)) {
                callback = options;
            } else if (_.isArray(options) && options.length > 0) {
                callback = options[0];
                // todo: I don't think we need to care about the name in this method,
                //       since Backbone uses the name just to point to a router instance callback method
                // if ((options.length > 1) && _.isString(options[1])) {
                //     name = options[1];
                // } else if (options.length > 1 && _.isObject(options[1])) {
                //     name = options[1].name;
                // }
            }

            if (!callback) {
                throw new Error('ivalid callback from route: ' + route);
            }

            return this.route(route, callback);
            // return this.route(route, name, callback);
        }
    });

    /* -- HISTORY ----------------------------------------------------------- */

    // Creates a reference to Backbone history instance in Monaco
    Monaco.history = Backbone.history;

}(window, window._, window.Backbone));