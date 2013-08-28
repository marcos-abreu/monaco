(function(window){
    'use strict';

    var Monaco = window.Monaco = (window.Monaco || {});

    /* -- APPLICATION ------------------------------------------------------ */
    var App = Monaco.Application = function(appName, options) {
        if (!appName) {
            throw new Error('required application parameter: appName');
        }
        this.name = appName;
        this.options = options || {};
        this.cid = _.uniqueId('app');

        this._settings      = {}; // used internally to store app settings ( get/set )
        this.models         = {}; // model list
        this.collections    = {}; // collection list
        this.views          = {}; // view list

        // create the applirouter
        // you can override this property with your own Router if you need
        var Router = Monaco.Router || Backbone.Router;
        this.Router = Router.extend({ regExRoutes : [] });

        // trigger a global envent for application module setup
        Monaco.trigger('app:built', this, this.options);
    };

    _.extend(App.prototype, Backbone.Events, {
        // Start the Monaco application
        start : function(options) {
            options = options || {};
            options.pushState = options.pushState || false;
            if (!_.has(this, 'Router')) {
                throw new Error('missing router definition');
            }
            this.router = new this.Router();
            Backbone.history.start({pushState: options.pushState});
            this.trigger('started');
        },

        // Interface used to add objects (models, collections, views and transitions) to your application
        add : function(className, object) {
            if (!object.prototype || !object.prototype.namespace) {
                throw new Error('missing required object property \'namespace\'');
            }

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
            if (_.has(this._settings, key)) {
                return this._settings[key];
            }
            var result = null;
            try {
                result = JSON.parse(window.localStorage.getItem(key));
            } catch( e ) {
                return void 0;
            }
            if (result === null) {
                return void 0;
            }
            this._settings[key] = result;
            return result;
        },

        // App setting set method
        set : function(key, value, persist) {
            persist = persist || false;
            if (key === void 0 || value === void 0) {
                throw new Error('set method required both key and value parameters');
            }
            if (persist) {
                try {
                    window.localStorage.setItem(key, JSON.stringify(value));
                } catch(e) {
                    // console.log( 'Warning: fail to persist key: ' + key );
                    return false;
                }
            }

            this._settings[key] = value;
        }
    });

    // Allow the `Monaco` object to serve as a global event bus
    _.extend(Monaco, Backbone.Events);

    /* -- COLLECTION ------------------------------------------------------- */
    Monaco.Collection = Backbone.Collection.extend({
        // application namespace
        namespace : 'collections',

        // override the fetch metod to add the default error router
        fetch : function(options) {
            options = options || {};
            var Router = ( this._app && this._app.Router ) ? this._app.Router : {};
            options.error = options.error || Router.defaultError || void 0;
            return Backbone.Collection.prototype.fetch.apply(this, arguments);
        }
    });

    /* -- MODEL ------------------------------------------------------------ */
    Monaco.Model = Backbone.Model.extend({
        // application namespace
        namespace : 'models',

        // override the fetch metod to add the default error router
        fetch : function(options) {
            options = options || {};
            var Router = ( this._app && this._app.Router ) ? this._app.Router : {};
            options.error = options.error || Router.defaultError || void 0;
            return Backbone.Model.prototype.fetch.apply(this, arguments);
        }
    });

    /* -- VIEW ------------------------------------------------------------- */
    Monaco.View = Backbone.View.extend({
        // application namespace
        namespace : 'views'
    });
      

    /* -- ROUTER ----------------------------------------------------------- */
    Monaco.Router = Backbone.Router.extend({
        this._routes = [];

        // override the Backbone Router constructor
        constructor : function() {
            var _self = this,
                initialize = this.initialize; // keep the original initialize method
            // wrap the initialize method to create each route with the necessary options
            this.initialize = function() {
                _.each(_self._routes, function(options, route) {
                    this._addroute(route, options);
                }, _self);
                initialize.apply(_self, arguments);
            };
            Backbone.Router.prototype.constructor.apply(this, arguments);
        },

        _addRoute : function(route, options) {
            options = options || {};

            if (!route) {
                throw new Error('invalid route: ' + route);
            }

            var callback = null,
                name = null; // todo: verify if it should be null or empty string

            if (_.isString(options)) {
                callback = options;
            } else if (_.isArray(options) && options.length > 0) {
                callback = options[0];
                if ((options.length > 1) && _.isString(options[1])) {
                    name = options[1];
                } else if (options.length > 1 && _.isObject(options[1])) {
                    name = options.name;
                }
            },

            if (!callback) {
                throw new Error('ivalid callback from route: ' + route);
            }

            return this.route(route, name, callback);
        },

        addRoutes : function(routes) {
            if (!routes || !_.isObject(routes)) {
                throw new Error('invalid routes format - please check the docs');
            }

            this._routes.push(routes);
        },


        addController : function(name, controller) {
            if (!name || name === '') {
                throw new Error('controller name is a required parameter');
            }
            if (!_.isFunction(controller)){
                throw new Error('controller method should be a function');
            }
            this.prototype[name] = controller;
        }
    });

    /* -- HISTORY ----------------------------------------------------------- */
    Monaco.History = Backbone.History;
}(window));