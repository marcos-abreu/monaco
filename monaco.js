(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['lodash', 'backbone', 'storage'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('lodash'), require('backbone'), require('storage'));
  } else {
    root.Monaco = factory(root._, root.Backbone, root.localStorage);
  }
}(this, function(_, Backbone, localStorage) {
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
    options = options || {};

    if (route !== '' && !route) {
      throw new Error('invalid route: ' + route);
    }

    var callback = null;
        // name = null; // todo: verify if it should be null or empty string

    if (_.isString(options)) {
      callback = options;
    }
    else if (_.isArray(options) && options.length > 0) {
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
      throw new Error('invalid callback from route: ' + route);
    }

    return this.route(route, callback);
    // return this.route(route, name, callback);
  }
});

/* -- HISTORY ----------------------------------------------------------- */
Monaco.History = Backbone.History;

// Creates a reference to Backbone history instance in Monaco
Monaco.history = Backbone.history;

return Monaco;
}));

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['lodash', 'backbone', 'storage'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('lodash'), require('backbone'), require('storage'));
  } else {
    root.Monaco = factory(root._, root.Backbone, root.localStorage);
  }
}(this, function(_, Backbone, localStorage) {
/*
 * Creates the Router monaco class to facilitate application routing
 */

// make sure monaco is defined as the main object
var Monaco = this.Monaco = (this.Monaco || {});

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
  var next;
  for (var i = (filters.length - 1) , l = 0; i >= l; i-- ) {
    next = controller;
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
    throw new Error('Monaco :: filter already exists: ' + name);
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
    throw new Error('Monaco :: required `name` parameter for `reverse` method');
  }

  url = this._getByName(name);
  _.each(params, function(value, key) {
    url = url.replace(':'+key, value);
  });

  return url;
};

return Monaco;
}));

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['lodash', 'backbone', 'storage'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('lodash'), require('backbone'), require('storage'));
  } else {
    root.Monaco = factory(root._, root.Backbone, root.localStorage);
  }
}(this, function(_, Backbone, localStorage) {
/*
 * Creates the View monaco class to manage `master` views and `sub-views` of your application
 */

// make sure monaco is defined as the main object
var Monaco = this.Monaco = (this.Monaco || {});

var View = Monaco.View;
Monaco.View = View.extend({
  // application namespace
  namespace : 'views',

  // subviews associated with this view with options to help define
  // and render each subview
  views : {},

  // override constructor function
  constructor : function(options) {
    options = options || {};
    // call the original constructor method
    View.prototype.constructor.apply(this, arguments);

    // assigns a template to the view
    if (options.template) {
      this.template = options.template;
    }

    // children view instances
    this.children = {};

    // instantiate each available subview
    _.each(this.views, this._subviewConstructor, this);

    // wrap the render method to work with subviews
    var render = this.render;
    this.render = _.bind(function() {
      // render the master view first
      render.apply(this, arguments);
      // then render subviews
      this._subviewsRender.apply(this, arguments);

      this.trigger('rendered', this);
      return this;
    }, this);

    // wrap the remove method to work with subviews
    var remove = this.remove;
    this.remove = _.bind(function() {
      // remove the subviews first
      this._subviewsRemove.apply(this, arguments);
      // then remove the master view
      remove.apply(this, arguments);

      this.trigger('removed', this);
      return this;
    }, this);
  },

  // Default render method that renders the template by appending it to the view's element
  render : function(data) {
    // only renders view's that have a template
    if ( this.template ) {
      // data will be a mixture of data parameters with either the view's collection or model
      data = _.extend(data, (this.collection ? this.collection.toJSON() : (this.model ? this.model.toJSON() : {})));

      // render the template using the data, appending the result into the view's element
      this.$el.append(this.template(data));
    }

    // return the current view after rendering to allow chainable calls
    return this;
  },

  // adds a subview after this view has been instantiated
  // the parameter view should be on the same format you would include your views in a template
  add : function(view) {
    var keys = _.keys(view),
        selector = keys[0],
        options = view[selector];

    if (!selector || !options) {
      throw new Error('Monaco :: Invalid subview parameters');
    }
    this._subviewConstructor(options, selector);
  },

  // creates the necessary subview instance(s), storing their reference
  _subviewConstructor : function(options, selector) {
    var ViewClass,
        params = {};

    options = options || {};
    // todo: find a way of checking if this is an anonymous function or a View Class that inherits from Monaco.View
    //       the following line just works with anonymous function that returns a Monaco.View class
    //       _.result can't be used since we want to specify the context (this keyword)
    ViewClass = options.viewClass ? options.viewClass.call(this) : Monaco.View;

    // todo: find a way of checking if this is an anonymous function or a Collection Class that inherits from Monaco.Collection
    //       the following line just works with anonymous function that returns a Monaco.Collection class
    //       _.result can't be used since we want to specify the context (this keyword)
    var collection = options.collection ? options.collection.call(this) : this.collection;

    // sets the collection parameter if available
    if (collection && !options.collectionItem) {
      params.collection = collection;
    }
    // sets the model parameter if available
    else if (options.model || this.model) {
      params.model = (options.model || this.model);
    }
    // sets the template parameter if available
    if (options.template) {
      params.template = options.template;
    }

    // if collectionItem then creates one subview for each model in the collection
    if (collection && options.collectionItem) {
      this._subviewPerModelConstructor(selector, collection, options, params, ViewClass);
    }
    // creates only one subview
    else {
      var view = new ViewClass(params);
      view.parent = this;
      this.children[selector] = view;
    }
  },

  // creates one subview per model in the collection, it also sets the master view
  // to handle events coming from the collection
  _subviewPerModelConstructor: function(selector, collection, options, params, ViewClass) {
    // unique namespace per view child to append methods specifically to these views
    var suffix = this.views[selector].suffix = options.suffix = (options.suffix || _.uniqueId('sfx'));
    this[suffix] = {};

    // // wrap the generic addOne to inject the itemView and listWrapper properties
    if (!this[suffix].addOne) {
      this[suffix].addOne = _.bind(function() {
        var args = Array.prototype.slice.call(arguments, 0);
        args.push({itemView: ViewClass, listWrapper: selector, callback: function(view) {
          view.parent = this;
          this.children[selector].push(view);
        }, context: this});
        return Monaco.ViewForModels.prototype.addOne.apply(this[suffix], args);
      }, this);
    }

    // // wrap the generic addAll to inject the itemView and listWrapper properties
    if (!this[suffix].addAll) {
      this[suffix].addAll = _.bind(function() {
          var args = Array.prototype.slice.call(arguments, 0);
          args.push({itemView: ViewClass, listWrapper: selector, callback: function(view) {
            view.parent = this;
            this.children[selector].push(view);
          }, context: this});
          return Monaco.ViewForModels.prototype.addAll.apply(this[suffix], args);
      }, this);
    }

    // // set the proper events so this view will be listening to the collection events
    // // and acting accordingly
    this.listenTo(collection, 'add', _.bind(this[suffix].addOne, this[suffix]));
    this.listenTo(collection, 'reset', _.bind(this[suffix].addAll, this[suffix]));

    this.children[selector] = [];

    // for each model in the collection creates a new view with the passed parameters
    collection.each(function(model) {
      var viewParams = _.clone(params);
      viewParams.model = model;
      var view = new ViewClass(viewParams);
      view.parent = this;
      this.children[selector].push(view);
    }, this);
  },

  // Render each subview after the main view has been rendered. Your can
  // override this by passing `autoRender: false` as an option for the subview
  _subviewsRender : function() {
    var _arguments = arguments;
    _.each(this.children, function(view, selector) {
      // have to check since some values of the this.children might be an array
      // instead of a view instance
      if (view instanceof Monaco.View) {
        var options = this.views[selector];
        // check if the view should be rendered
        if (!_.has(options, 'autoRender') || options.autoRender === true) {

          // render one view per collection model by using the `addAll` method
          if (view.collection && options.collectionItem) {
            // todo: verify if I should create a third argument as I'm doing now to
            //       include the targets for the viewClass and wrapper of the list
            //       or if I should include them in the options object parameter instead
            view[options.suffix].addAll(view.collection, {}, {
              itemView: options.viewClass ? options.viewClass.call(view) : Monaco.ViewClass,
              listWrapper: selector
            });
          }

          // render a single view
          else {
            // render the subview and append its content into the parent view using the
            // selector associated with the subview
            // todo: remove jQuery dependency
            this.$el.find(selector).append(view.render.apply(view, _arguments).el);
          }
        }
      }
    }, this);
  },

  // Remove (DOM + Events) each subview before removing the main view
  _subviewsRemove : function() {
    var _arguments = arguments;
    _.each(this.children, function(view, selector) {

      // get original view options
      var options = this.views[selector];

      // remove each collection's model views
      if (_.isArray(view)) {
        // remove each subview from an array of views
        for(var i = 0, l = view.length; i < l; i++) {
            view[i].remove.apply(view, _arguments);
        }

        // removed event listeners
        // todo: verify if I need to manually unregister the event listeners
        this.stopListening(this.collection, 'add',  this[options.suffix].addOne);
        this.stopListening(this.collection, 'reset', this[options.suffix].addAll);

        // remove the suffix namespace
        delete this[options.suffix];
      }
      // remove single view
      else {
        view.remove.apply(view, _arguments);
      }
    }, this);

    // resetting the this.children to an empty object
    this.children = {};
  }

});

Monaco.ViewForModels = Monaco.View.extend({
  // adds one element to the set of elements by rendering the content of a model
  addOne : function(model, collection, options, info, fromAddAll) {
    if ( !(collection instanceof Monaco.Collection) ) {
      fromAddAll = info;
      info = options;
      options = collection;
      collection = null;
    }
    var ViewClass = info.itemView || this.itemView,
        view = new ViewClass( { model : model } ),
        content = view.render( model.toJSON() ).el;

    if (info && info.callback) {
      info.callback.call(info.context || this, view);
    }
    if (fromAddAll === true) {
      return content;
    }
    // todo: the following was disabled until I define what to do with jquery as a dependency
    // $( info.listWrapper || this.listWrapper ).append( content );
  },

  // adds one element per model based on a collection instance
  addAll : function(collection, options, info) {
    var result = [];
    options = options || {};
    if ( !options.keepValues ) {
      // todo: the following was disabled until I define what to do with jquery as a dependency
      // $( info.listWrapper || this.listWrapper ).html(''); //clear list
    }
    collection.each( function( obj ) {
      result.push(this.addOne( obj, options, info, true ));
    }, this );

    // todo: the following was disabled until I define what to do with jquery as a dependency
    // $( info.listWrapper || this.listWrapper ).append(result);
  }
});

return Monaco;
}));

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['lodash', 'backbone', 'storage'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('lodash'), require('backbone'), require('storage'));
  } else {
    root.Monaco = factory(root._, root.Backbone, root.localStorage);
  }
}(this, function(_, Backbone, localStorage) {
/*
 * Creates a caching layer for Collections and Models, in order to avoid unnecessary
 * requests to the server
 */

// make sure monaco is defined as the main object
var Monaco = this.Monaco = (this.Monaco || {});

// Local Cache Application setup
Monaco.on('app:built', function(app, options) {
  // set a reference to the application into the local cache
  app.local._app = app;

  // check the global cacheLocal property for the application
  if (_.has(options, 'cacheLocal')) {
    app.local.autoCache = Boolean(_.result(options, 'cacheLocal'));
  }

  // check the global cacheExpire property for the application
  if (_.has(options, 'cacheExpire')) {
    var cacheExpire = _.result(options, 'cacheExpire');
    app.local.cacheExpire = (_.isNull(cacheExpire) || _.isNumber(cacheExpire)) ? cacheExpire : void 0;
  }

  // cache any prefetched data for later use on the application
  if (options.prefetched) {
    _.each(options.prefetched, function(value, key) {
      if (!value.data) {
        return;
      }
      this.local.set({resource: key, models:[]}, value.data, value.expire);
    }, app);
    delete app.options.prefetched;
  }
});

// overrides Monaco.Application add method to check for the required `resources` property
var applicationAdd = Monaco.Application.prototype.add;
Monaco.Application.prototype.add = function(className, Class) {
  if (Class.prototype.namespace === 'collections' && (!Class.prototype.resource || Class.prototype.resource === '')) {
    throw new Error('Monaco :: required `resource` property missing from this collection definition');
  }
  return applicationAdd.apply(this, arguments);
};

// Application Local Cache Object
Monaco.Application.prototype.local = {
  // by default the application won't auto cache your api calls
  autoCache : false,

  // default cache expire (in minutes) if you enable local caching
  cacheExpire : 30,

  // get an object from local cache
  // return null instead of undefined to comply with the localStorage getItem api
  get : function( obj ) {
    var isCollection = _.has(obj, 'models'),
        collection = isCollection ? obj : (obj.collection || null),
        resource = collection ? _.result(collection, 'resource') : _.result(obj, 'resource');

    if (resource) {
      var data = this._getLocalData(resource);
      if (data) {
        data.resp = this.decompress(data.resp);

        // get cached model
        if (!isCollection) {
          // extract data from model linked with a collection
          if (collection) {
            data = _.find(collection.parse(data.resp), function(item) {
              return item[obj.idAttribute] === obj.id;
            });

            // only this case needs to retest the expiration, since the expiration tested
            // in _getLocalData was from the collection, and the model might have its own
            // expiration rule
            if (data && (!data._ts || !this._isExpired(data))) {
              delete data._ts; // remove possible timestamp property
              return data;
            }
          }

          // extract data from model not linked with any collection
          else if(data.resp[obj.idAttribute] === obj.id) {
            return data.resp;
          }
        }
        // get cached collection
        else {
          return data.resp;
        }
      }
    }
    return void 0;
  },

  // set an object in local cache
  set : function(obj, data, expire) {
    var isCollection = _.has(obj, 'models'),
        collection = isCollection ? obj : obj.collection || null,
        resource = collection ? _.result(collection, 'resource') : _.result(obj, 'resource');
    expire = (expire !== void 0) ? expire : false;

    if (!resource) {
      // todo: find a way to log  - 'unable to identify object\'s resource'
      return;
    }

    // caching Model linked with Collection
    if (!isCollection && collection) {
      // in case the model has expireLocal set for
      var modelExpire = expire || _.result(obj, 'expireLocal') ;
      if (modelExpire) {
          data = this._setExpire(data, modelExpire, true);
      }
      data = this._addToCollectionData(obj, data, collection);

      expire = (expire !== false) ? expire : _.result(collection, 'expireLocal');
    }
    // Collections or Models NOT linked with any Collection
    else {
      expire = (expire !== false) ? expire : _.result(obj, 'expireLocal');
    }

    data = this.compress(data);
    data = this._setExpire(data, expire);

    this._storageSet(resource, data);
    this._memorySet(resource, data);
    return true;
  },

  // clear a specific resource or all resources
  clear : function(resource) {
    resource = resource || null;
    if (!resource) {
      return this._clearAll();
    }
    return this._clearItem(resource);
  },

  // compress data to be stored - override this with your own data compress implementation
  compress : function(data) { return data; },

  // decompress data - override this with your own data decompress implementation
  decompress : function(data) { return data; },

  // get the local data for a collection resource
  _getLocalData : function(resource) {
    var localData = null,
        caching = ['memory', 'storage'];

    for (var i = 0, j = caching.length; i < j; i++) {
      localData = this['_'+caching[i]+'Get'](resource);
      if (localData && !this._isExpired(localData)) {
        if (caching[i] === 'storage') {
         this._memorySet(resource, localData);
        }
        return _.clone(localData);
      }
      // todo: add an option on the local caching setup that allows it to control
      //       the following behaviour
      // clean up the expired data
      else if(localData) {
        this.clear(resource);
      }
    }

    return null;
  },

  // merge the model with the collection data
  _addToCollectionData : function(model, data, collection) {
    var restfulData,
        collectionData = this.get(collection);
    if (collectionData) {
      restfulData = collection.parse(collectionData);
      collection.reset(restfulData, { silent: true });
    }

    collection.add( data, { silent: true, merge: true } );
    return collection.revertParse && typeof collection.revertParse === 'function' ? collection.revertParse() : collection.toJSON();
  },

  // get the resource if it is available in memory
  // returns the object or if the object is not found it returns
  // null ( to comply with the localStorage specs)
  _memoryGet : function(resource) {
    return this._memory ? this._memory[resource] : null;
  },

  // set the resource data in memory
  _memorySet : function(resource, data) {
    this._memory = this._memory || {};
    this._memory[resource] = data;
  },

  // get the resource if it is available in localStorage
  // returns the object or if the object is not found null
  _storageGet : function(resource) {
    var result;
    try {
      result = localStorage.getItem(this._getKey(resource));
    } catch(e) {
      return null;
    }
    return (result === undefined || result === 'undefined' || result === null) ? null : JSON.parse(result);
  },

  // set the resource data in localStorage
  _storageSet : function(resource, data) {
    var key = this._getKey(resource),
        keys;
    try {
      keys = localStorage.getItem('monaco-' + this._app.name + ':keys') || '{}';
    }
    catch(e) {
      return; // fail silently
    }

    var newKeys = JSON.parse(keys);
    newKeys[key] = data._ts;
    try {
      localStorage.setItem('monaco-' + this._app.name + ':keys', JSON.stringify(newKeys));
      localStorage.setItem(key, JSON.stringify(data));
    } catch(e) {
      // todo: add a warning here
      try {
        // resetting the keys to its original value if either the new keys or data failed
        localStorage.setItem('monaco-' + this._app.name + ':keys', keys);
      } catch(exception) {
        // fail silently - todo: add a warning here
      }
    }
  },

  // add the expire timestamp to the data object
  _setExpire : function(data, expire, asProperty) {
    var timestamp = null;
    expire = ( _.isNumber( expire ) || _.isNull( expire ) ) ? expire : void 0;
    if ( !_.isNull( expire ) ) {
      var date = new Date();
      date.setMinutes( date.getMinutes() + ( expire || this.cacheExpire ) );
      timestamp = date.getTime();
    }
    // if asProperty is set to true then append the timestamp to the data
    // usefull for setting expire for individual methods
    if (asProperty === true) {
      data._ts = timestamp;
      return data;
    }
    return {
      _ts : timestamp,
      resp : data
    };
  },

  // check if the data object is expired
  _isExpired : function(data) {
    var expire = data._ts,
        now = new Date();
    return ( !_.isNull( expire ) && now.getTime() > expire );
  },

  // clear a resource item from localStorage and memory
  _clearItem : function(resource) {
    var key = this._getKey(resource);
    // remove the item from local storage
    try {
      localStorage.removeItem(key);
    } catch(e) {
      throw new Error('Monaco :: unable to remove the localStorage key: ' + key);
    }

    // remove the item from memory
    if ( _.has(this._memory, resource) ) {
      delete this._memory[resource];
    }

    // clean-up the application keys
    var keys;
    try {
      keys = JSON.parse(localStorage.getItem('monaco-' + this._app.name + ':keys')) || {};
    } catch(e) {}
    if (keys) {
      delete keys[key];
      return this._app.set('monaco-' + this._app.name + ':keys', keys, true);
    }
  },

  // clear all resources associated with this application from localStorage and memory
  _clearAll : function() {
    // clean up localStorage
    var keys = {};
    try {
      keys = JSON.parse(localStorage.getItem('monaco-' + this._app.name + ':keys')) || {};
    } catch(e) {}
    _.each(keys, function(value, key) {
      try {
        var resource = key.split('#');
        resource = resource[1];
        localStorage.removeItem(key);
      } catch(e) {
        // do nothing
      }
    }, this);

    // clean up memory
    this._memory = {};

    // clean-up the application keys
    this._app.set('monaco-' + this._app.name + ':keys', {}, true);
  },

  // get a key based on the resource name and the application
  _getKey : function(resource) {
    return this._app.name + '#' + resource;
  }
};

var collectionInitialize = Monaco.Collection.prototype.initialize;
Monaco.Collection.prototype.initialize = function() {
  // todo: the `remove` and `add` events are called once per each model what causes
  //       this method to reset the collection multiple times, if there was a way of
  //       knowing that a certain event is the last in a series of events fired then
  //       we could minimize the number of times we reset the collection local cache

  // info: don't need to listen for the `destroy` model event, because it will
  //       trigger a remove from the collection

  // listen to collection events and updates local caching accordingly
  this.on('add remove change reset', function() {
    var options = arguments.length > 0 ? arguments[arguments.length - 1] : {},
        data;

    // if original call IS NOT a fetch from local storage and this collection
    // should be cached
    if (!options.fromLocal &&
      (_.result(this, 'cacheLocal') === true || this._app.local.autoCache === true)) {

      // ????
      // this.fetch({localOnly: true, cacheLocal: false, silent: true});

      // make sure the data has the same structure as the original server request
      data = ( this.revertParse && typeof this.revertParse === 'function' ) ? this.revertParse() : this.toJSON();

      // replace the local data with the new data
      this._app.local.set(this, data);
    }
  }, this);
  return collectionInitialize.apply(this, arguments);
};

var modelInitialize = Monaco.Model.prototype.initialize;
Monaco.Model.prototype.initialize = function() {
  // listen to collection events and updates local caching accordingly
  this.on('change', function() {
    var options = arguments.length > 0 ? arguments[arguments.length - 1] : {},
        data;

    // if original call IS NOT a fetch from local storage and this collection
    // should be cached
    if (!options.fromLocal &&
        (_.result(this, 'cacheLocal') === true || (this._app && this._app.local.autoCache === true))) {

      // ????
      // this.fetch({localOnly: true, cacheLocal: false, silent: true});

      // make sure the data has the same structure as the original server request
      data = ( this.revertParse && typeof this.revertParse === 'function' ) ? this.revertParse() : this.toJSON();

      // replace the local data with the new data
      this._app.local.set(this, data);
    }
  }, this);
  return modelInitialize.apply(this, arguments);
};

/* -- SYNC ------------------------------------------------------------- */
Monaco.sync = Backbone.sync;

// override the Monaco (Backbone) sync method, so that read calls make
// usage of the local caching data for Monaco Models or Collections
Backbone.sync = function(method, model, options) {
  options = options || {};
  var app = model._app, // A Monaco Model or Collection will have a reference to the application
      localOnly = (options.localOnly === true || model.localOnly === true);
  if (app && method === 'read') {
    // Attempt to retrieve the data from local cache and if succeed it will call the appropriated success method
    var data = (options.fresh === true ) ? null : app.local.get(model);
    if (data) {
      options.fromLocal = true;
      if (options.success) {
        options.success(data);
      }
      return true;
    }

    var isCollection = _.has(model, 'models');

    // call the `error` callback if no data is found and `localOnly` is set to true
    if (localOnly === true) {
      if (options.error) {
        options.error({}, 'Error: resource not found locally', {});
      }
      return;
    }
    // Check the configuration levels and wrap the success call back if at any level we have cacheLocal defined
    // If we have a custom cache control key, we want to cache regardless of whether the object wants to cache or not
    else {
      var cacheLocal = false,
          success;

      var customCachePolicy = (isCollection && model.cachePolicy) ? model.cachePolicy :
                                (!isCollection && model.collection) ? model.collection.cachePolicy :
                                  (app.options.cachePolicy) ? app.options.cachePolicy : void 0;

      //Determine if we need to do local caching

      //Case 1: Custom Caching Policy supposedly sent by server response
      cacheLocal = (customCachePolicy && customCachePolicy !== 'local');

      //Case 2: cacheLocal specified to be true at app/collection/model/fetch level
      if ((_.result(options, 'cacheLocal') === true) || // fetch level
          (!_.has(options, 'cacheLocal') &&  isCollection && _.result(model, 'cacheLocal') === true) || // collection level
            (!_.has(options, 'cacheLocal') && (!isCollection && model.collection) && _.result(model.collection, 'cacheLocal') === true) || // model (with collection) level
              (!_.has(options, 'cacheLocal') && (!isCollection && !model.collection) && _.result(model, 'cacheLocal') === true) || // model (no collection) level
                  (!_.has(options, 'cacheLocal') && (!_.has(model, 'cacheLocal')) && app.local.autoCache === true)) { // app level
        cacheLocal = true;
      }

      if (cacheLocal) {
        success = options.success;
        options.success = function(resp, status, xhr) {

          // local caching policy will use the expiration defined or Monaco's default
          if (!customCachePolicy || customCachePolicy === 'local') {
            app.local.set(model, resp, _.result(options, 'expireLocal'));
          }

          // custom caching policy will use the expiration sent by the server
          // and if not available or too small it won't cache the resource
          else {
            var expire = xhr.getResponseHeader(customCachePolicy);
            if (expire) {
              // Cache-Control sends expire time in seconds, but Monaco uses minutes
              expire = parseInt(expire.match(/max-age=([\d]+)/)[1], 10);
              if (expire && ((expire / 60) > 0)) {
                app.local.set(model, resp, (expire / 60));
              }
            }
          }

          if (success) {
            success.apply(this, arguments);
          }
        };
      }
    }
  }

  // return earlier for model/collections or request options set to localOnly
  if (localOnly === true) {
    return;
  }
  return Monaco.sync(method, model, options);
};

return Monaco;
}));

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['lodash', 'backbone', 'storage'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('lodash'), require('backbone'), require('storage'));
  } else {
    root.Monaco = factory(root._, root.Backbone, root.localStorage);
  }
}(this, function(_, Backbone, localStorage) {
/*
 * Overrides backbone navigation system in order to provide page tracking
 * ps: by default it uses Google Analytics
 *     to integrate it with other platforms check the docs.
 */

// make sure monaco is defined as the main object
var Monaco = this.Monaco = (this.Monaco || {});

// keep a reference to the original `loadUrl` method from Monaco
var loadUrl = this.Monaco.History.prototype.loadUrl,
    self = this;

// overridden method to inject a call to track page views
Monaco.History.prototype.loadUrl = function() {
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
Monaco.History.prototype.trackPageview = function(fragment) {
  if( self.ga !== void 0 ) {
    self.ga('send', 'pageview', fragment);
  }
};

return Monaco;
}));

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['lodash', 'backbone', 'storage'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('lodash'), require('backbone'), require('storage'));
  } else {
    root.Monaco = factory(root._, root.Backbone, root.localStorage);
  }
}(this, function(_, Backbone, localStorage) {
/*
 * Creates the Experiments monaco class, used to work with application experiments
 * ps: by default `Monaco.Experiments` uses Google Analytics to log experiment events
 *     to integrate it with other platforms check the docs.
 */

// make sure monaco is defined as the main object
var Monaco = this.Monaco = (this.Monaco || {});

// Transition Application setup
Monaco.on('app:built', function(app, options) {
  app.experiments = new Monaco.Experiments(options.experiments);
});

/* -- MAIN OBJECT ------------------------------------------------------ */
// Experiments Constructor
var Experiments = Monaco.Experiments = function(options) {
  options = options || {};
  this._experiments = []; // internal list of experiments

  // merge the default options with the custom options received
  this.options = _.extend({
    ga : {slot : 1, scope: 2},
    cookie : {prefix: 'ab-', days: 360, baseDomain: false }
  }, options);
};

Experiments.prototype = _.extend(Experiments.prototype, {
  // remove the experiment reference from the internal list
  // _removeReference: function(experiment) {
  //     var index = this._experiments.indexOf(experiment);
  //     if (index >= 0) {
  //         this._experiments.splice(index, 1);
  //     }
  // },

  // returns an experiment object based on a key search
  get: function(key) {
    return _.find(this._experiments, function(experiment) {
      return experiment.key === key;
    });
  },

  // set an experiment object in the internal list of experiments
  set: function(key, groups, options) {
    var experiment = key;
    if ( !(experiment instanceof Monaco.Experiment) ) {
      experiment = new Monaco.Experiment(this, key, groups, _.extend({}, this.options, options));
    }
    this._experiments.push(experiment);
  },

  // remove all split tests
  // remove: function() {
  //     _.each(this._experiments, function(experiment) {
  //         experiment.remove();
  //     });
  // },

  // opt-out the current user from all experiments
  optout: function() {
    _.each(this._experiments, function(experiment) {
      experiment.optout();
    });
  },

  // split all active experiments
  split: function() {
    _.each(this._experiments, function(experiment, index) {
      experiment.split();
    });
  }
});

/* -- Individual Experiment Object ------------------------------------------- */
var Experiment = Monaco.Experiment = function(parent, key, groups, options) {
  // Every experiment needs a key
  if ( !key ) {
    throw new Error('Monaco :: failed to create the experiment: ' + key + ' - experiment key required' );
  }
  groups = groups || {};
  options = options || {};
  options.users = options.users || 0;
  // the percentage of users to participate on the experiment should be between 0 and 1
  if ( !_.isNumber( options.users ) || options.users > 1 || options.users < 0 ) {
    throw new Error('Monaco :: failed processing experiment: \'' + key + '\' - users not defined within allowed range' );
  }
  // since the variations will be chosen evenly you can't have more variations than
  // the percentage number of users participating in the experiment
  this.usersPerGroup = Math.floor( ( options.users * 100 ) / _.size( groups ) );
  if ( this.usersPerGroup < 1 ) {
    throw new Error('Monaco :: failed processing experiment: \'' + key + '\' - individual groups set to less than 1%' );
  }
  this.parent = parent;
  this.key = key;
  this.groups = groups;
  this.normalized = this._normalizeGroup( groups );
  // this.cookiePrefix = options.cookie.prefix || 'ab-';
  this.options = options;
  this.cookie = {
    set : Monaco.utils.setCookie,
    get : Monaco.utils.getCookie
  };
};

// normalize groups based on the percentage set for each group
Experiment.prototype = _.extend(Experiment.prototype, {
  // original group key used when the user is not assigned to any variation
  original: '__original__',

  // keep track of the current variation this user is assigned to after splitting this experiment
  current: null,

  // split this experiment returning the group this user has been set for this experiment
  split: function() {
    if (!this.current) {
      var cookieOpt = this.options.cookie,
          groupKey = this.cookie.get(cookieOpt.prefix + this.key);
      if(!groupKey) {
        groupKey = this.normalized[Math.floor( Math.random() * this.normalized.length )];
        this.cookie.set(cookieOpt.prefix + this.key, groupKey, cookieOpt.days, cookieOpt.baseDomain);
        this.saveGroup(groupKey);
      }
      // this.current = groupKey === this.original ? groupKey : this.groups[groupKey];
      this.current = groupKey;
    }

    return this.current;
  },

  // return the value of a variation based on its key
  // if no key is provided and the split was already done
  // this method will return the value of the chosen group
  get: function(key) {
    if (!key && this.current) {
      return this.groups[this.current];
    } else if ( !key ) {
      return void 0;
    }
    return this.groups[key];
  },

  // helper method that will return the name of the controller based on this experiment variation
  controller: function(methodName) {
    return !this.current || this.current === this.original ? methodName : methodName + this.get(this.current).suffix;
  },

  // helper method that will return the class name for the view based on this experiment variation
  view: function(ViewClass) {
    return !this.current || this.current === this.original ? ViewClass : ViewClass + this.get(this.current).suffix;
  },

  // helper method that will return the class name for the template based on this experiment variation
  template: function(template) {
    return !this.current || this.current === this.original ? template : template + '.' + this.get(this.current).suffix;
  },

  // remove this experiment
  // remove: function() {
  //     var cookieOpt = this.options.cookie;
  //     this.current = null;
  //     this.cookie.set(cookieOpt.prefix + this.key, '', -1, cookieOpt.baseDomain);
  //     this.parent._removeReference(this);
  // },

  // optout the current user from a specific experiment, basically setting the cookie
  // to the `this.original` property value value
  optout: function() {
    var cookieOpt = this.options.cookie;
    this.cookie.set(cookieOpt.prefix + this.key, this.original, cookieOpt.days, cookieOpt.baseDomain);
  },

  // saves the experiment data, when a user joins one variation of the experiment
  // override this method if you want to use another service other than Google Analytics
  saveGroup: function(groupKey) {
    _gaq.push(['_setCustomVar', this.options.ga.slot, this.key, groupKey, this.options.ga.scope]);
    _gaq.push(['_trackEvent', 'experiments', 'join', (this.key + '|' + groupKey)]);
  },

  toJSON: function() {
    return {
      current: this.current,
      group: this.get(),
      groups: this.groups
    };
  },

  // returns an array of 100 items based on the probability of each group
  _normalizeGroup: function(groups) {
    var normalized = [],
        count = 0;
    for (var groupKey in groups) {
      if (groups.hasOwnProperty(groupKey)) {
        for (var i=0, j=this.usersPerGroup; i < j; i++) {
          normalized.push(groupKey);
          count++;
        }
      }
    }

    var remaining = 100 - count;
    while (--remaining >=0) {
      normalized.push(this.original);
    }
    return normalized;
  }
});

return Monaco;
}));

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['lodash', 'backbone', 'storage'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('lodash'), require('backbone'), require('storage'));
  } else {
    root.Monaco = factory(root._, root.Backbone, root.localStorage);
  }
}(this, function(_, Backbone, localStorage) {
/*
 * Creates the Transition monaco class to help applications ui transition state
 */

// make sure monaco is defined as the main object
var Monaco = this.Monaco = (this.Monaco || {});

var utils = Monaco.utils = Monaco.utils || {};

// Transition Application setup
Monaco.on('app:built', function(app, options) {
  app.transitions    = {}; // transition list
});

// transition from currentView to targetView
Monaco.Application.prototype.transitionTo = function(targetView, options, Transition) {
  if (!targetView) {
    throw new Error('Monaco :: missing target view');
  }

  var currentView = (this.currentView || null),
      TransitionClass = Transition || this.transitions.DefaultTransition || Monaco.Transition,
      transition = new TransitionClass();

  this.currentView = transition.start(currentView, targetView, options);
};

/* -- TRANSITION ------------------------------------------------------- */
var Transition = Monaco.Transition = function(options) {
  this.initialize.apply(this, arguments);
};

// extend the Monaco.Transition with Backbone.Events engine
_.extend(Monaco.Transition.prototype, Backbone.Events, {
  // application namespace
  namespace : 'transitions',

  // initialization - Override it with your own logic
  initialize : function() {},

  // execute the transition - override this method when creating custom transitions
  // returns the view that will be assigned to the application currentView
  start : function(fromView, toView, options) {
    options = options || {};
    if (fromView && toView.el === fromView.el) {
      fromView.remove();
      toView.render(options);
    }
    else if (fromView) {
      toView.render(options);
      fromView.remove();
    } else {
      toView.render(options);
    }
    return toView;
  }
});

Transition.extend = utils.extend;

return Monaco;
}));
