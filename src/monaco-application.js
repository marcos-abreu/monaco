(function(window){

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
        this.dispatcher     = _.extend({cid: 'dispatcher'}, Backbone.Events); // event agregator

        // create the applirouter
        // you can override this property with your own Router if you need
        var Router = Monaco.Router || Backbone.Router;
        this.Router = Router.extend({ regExRoutes : [] });

        // trigger a global envent for application module setup
        Monaco.trigger('app:built', this, this.options);
    };

    _.extend(App.prototype, {
        // Start the Monaco application
        start : function(options) {
            options = options || {};
            options.pushState = options.pushState || false;
            if (!_.has(this, 'Router')) {
                throw new Error('missing router definition');
            }
            this.router = new this.Router();
            Backbone.history.start({pushState: options.pushState});
        },

        // Interface used to add objects (models, collections, views and transitions) to your application
        add : function(className, object) {
            if (!object.prototype || !object.prototype.namespace) {
                throw new Error('missing required object property \'namespace\'');
            }

            // adds the app reference when the object is instanciated
            // var app = this,
            //     cto = _.has(object, 'constructor') ? object.constructor : object;
            // object = object.extend({
            //     constructor : function(options) {
            //         this._app = app;
            //         return cto.apply(this, arguments);
            //     }
            // });

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
        namespace : 'views'
    });

    /* -- ROUTER ----------------------------------------------------------- */
    Monaco.Router = Backbone.Router;

}(window));