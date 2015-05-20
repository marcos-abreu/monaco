/*
 * Creates the Application monaco class, used to instantiate monaco applications
 */

// make sure monaco is defined as the main object
var Monaco = this.Monaco = (this.Monaco || {});

/* -- APPLICATION ------------------------------------------------------ */
var App = Monaco.Application = function(appName, options) {
  if (!appName) {
    throw new Error('Monaco :: missing required application parameter: appName');
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
  this.router = new RouterClass({app: this, routes: options.routes});

  // trigger a global event for application module setup
  Monaco.trigger('app:built', this, options);
};

_.extend(App.prototype, Backbone.Events, {
  // Start the Monaco application
  start : function(options) {
    options = options || {};
    options.pushState = options.pushState || false;

    // when starting the application an instance of a router should exist
    if (!_.has(this, 'router')) {
      throw new Error('Monaco :: missing required router instance before starting the application');
    }

    // Add all unregistered routes before starting the history
    this.router._addRoutes();

    Monaco.history.start(options);

    // trigger a global event for application module setup
    Monaco.trigger('app:initialized', this, options);
  },

  // Interface used to add objects (models, collections, views and transitions) to your application
  add : function(className, object) {

    // all objects added through this method needs a namespace
    if (!object.prototype || !object.prototype.namespace) {
      throw new Error('Monaco :: missing required object property \'namespace\'');
    }

    // fail on duplicated objects being created on the same namespace
    if (this[object.prototype.namespace][className]) {
      throw new Error('Monaco :: ' + className + ' have already been defined in ' + this.name + '.' + object.prototype.namespace);
    }

    // injects the app reference in the object prototype
    object.prototype._app = this;

    // adds the object using the proper namespacing
    this[object.prototype.namespace][className] = object;
  },

  // App setting get method, returning undefined if not found or any error occurs
  // todo: return null instead of undefined to comply with the localStorage api
  get : function(key) {
    // searchs for the key in memory
    if (_.has(this._settings, key)) {
      return this._settings[key];
    }

    // searchs for the key in local storage
    var result = null;
    try {
      result = JSON.parse(localStorage.getItem(key));
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
      throw new Error('set method required both key and value parameters { key: ' + key + ' | value: ' + value + ' }');
    }

    // store the key/value in memory
    this._settings[key] = value;

    // if persist is set to true then store the key/value in localStorage
    if (persist === true) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch(e) {
        // console.log( 'Warning: fail to persist key: ' + key );
        return false;
      }
    }
    return true;
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
// override the fetch method to add the default error router
var _collectionFetch = function(options) {
  options = fetchError.call(this, options);
  return Backbone.Collection.prototype.fetch.call(this, options);
};

try {
  Monaco.Collection = Backbone.Collection.extend({
    // application collection namespace
    namespace : 'collections',

    // override the fetch method to add the default error router
    fetch : _collectionFetch
  });
}
catch(e) {
  // this addresses an issue with some versions of google browser - better described
  // by this ticket on backbone: https://github.com/jashkenas/backbone/issues/1475
  // and this ticket on chrome forum: https://code.google.com/p/chromium/issues/detail?id=136380
  // sample of user agent where the problem was observed:
  //
  // Mozilla/5.0 (Linux; U; Android 4.1.1; tr-tr; Build/JRO03C) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Safari/534.30
  // Mozilla/5.0 (Linux; U; Android 4.0.4; en-us; Next7P12-8G Build/IMM76I) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Safari/534.30
  //
  // Note that not all Android 4.1.1 or Android 4.0.4 triggered the same misbehaviour
  Monaco.Collection = Backbone.Collection;
  Monaco.Collection.prototype.namespace = 'collections';
  Monaco.Collection.prototype.fetch = _collectionFetch;
}

    /* -- MODEL ------------------------------------------------------------ */
var _modelFetch = function(options) {
  options = fetchError.call(this, options);
  return Backbone.Model.prototype.fetch.call(this, options);
};

try {
  Monaco.Model = Backbone.Model.extend({
    // application model namespace
    namespace : 'models',

    // override the fetch method to add the default error router
    fetch : _modelFetch
  });
}
catch(e) {
  // this addresses an issue with some versions of google browser - better described
  // by this ticket on backbone: https://github.com/jashkenas/backbone/issues/1475
  // and this ticket on chrome forum: https://code.google.com/p/chromium/issues/detail?id=136380
  // sample of user agent where the problem was observed:
  //
  // Mozilla/5.0 (Linux; U; Android 4.1.1; tr-tr; Build/JRO03C) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Safari/534.30
  // Mozilla/5.0 (Linux; U; Android 4.0.4; en-us; Next7P12-8G Build/IMM76I) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Safari/534.30
  //
  // Note that not all Android 4.1.1 or Android 4.0.4 triggered the same misbehaviour

  Monaco.Model = Backbone.Model;
  Monaco.Model.prototype.namespace = 'models';
  Monaco.Model.prototype.fetch = _modelFetch;
}

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
  constructor : function(options) {
    this.app = arguments.length > 0 ? arguments[0].app : void 0;
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

    while ((route = routeList.pop())) {
      this._uroutes.unshift({key: route, value: routes[route]});
    }
  },

  // tries to retrieve the original function name
  _getFuncName : function(fn) {
    var name;

    if (typeof fn !== 'function' ) {
      return; //undefined
    }
    // browser supports the new es6 function.name
    else if (fn.name) {
      return fn.name;
    }
    // old browser fallback implementation
    else {
      name = fn.toString().match(/function ([^\(]+)/);
      if (name && name[1]) {
        return name[1];
      }
    }

    return; // undefined if it couldn't figure it out
  },

  // adds all undefined routes into Backbone.Router
  _addRoutes : function() {
    var route;
    while((route = this._uroutes.pop())) {
      // this needs to be added to the _route list before the route gets added to the Router.
      this._routes.push(route);
      this._addRoute(route.key, route.value);
    }
  },

  // adds one route into Backbone.Router
  _addRoute : function(route, options) {
    var name,
        callback;

    options = options || {};

    if (route !== '' && !route) {
      throw new Error('invalid route: ' + route);
    }

    if (_.isString(options)) {
      name = options;
    }
    else if (_.isArray(options) && options.length > 0) {
      name = options[0];
      if (typeof name === 'function') {
        callback = name;
        name = this._getFuncName(callback) || '';
      }
      else if (typeof options[1] === 'function') {
        callback = options[1];
      }
    }
    else {
      throw new Error('monaco :: invalid route options from route: ' + route );
    }

    if (!name || !_.isString(name) || (name === '' && !callback)) {
      throw new Error('invalid callback (name) from route: ' + route);
    }

    return this.route(route, name, callback);
  }
});

/* -- HISTORY ----------------------------------------------------------- */
Monaco.History = Backbone.History;

// Creates a reference to Backbone history instance in Monaco
Monaco.history = Backbone.history;
