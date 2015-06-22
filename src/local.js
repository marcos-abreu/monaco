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

    // an expire option will override any instance or class defined expiration
    expire = (expire !== void 0) ? expire : false;

    // don't cache if resource property is not available
    if (!resource) {
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

  // merge the model with the collection data, returning the new collection data
  // as if it was the data requested from the server
  _addToCollectionData : function(model, data, collection) {

    var modelRef = collection.get( model.id );
    if ( modelRef ) {
      // todo: verify if this should or shouldn't happen silently
      modelRef.set( data, { silent: true } );
    }
    else {
      // todo: verify if this should or shouldn't happen silently
      collection.add( data, { silent: true } );
    }

    // return the data as if it was requested by an api request
    return collection.revertParse && typeof collection.revertParse === 'function' ?
              collection.revertParse() :
              collection.toJSON();
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

  this._cacheCollection = function(options) {
    var data;

    // if original call IS NOT a fetch from local storage and this collection
    // should be cached
    if (this._app && !options.fromLocal &&
      (_.result(this, 'cacheLocal') === true || this._app.local.autoCache === true)) {

      // make sure the data has the same structure as the original server request
      data = ( this.revertParse && typeof this.revertParse === 'function' ) ? this.revertParse() : this.toJSON();

      // replace the local data with the new data
      this._app.local.set(this, data);
    }
  };

  // remove the collection from local storage if it is reset
  this.on('reset', function() {
    var options = arguments.length > 0 ? arguments[arguments.length - 1] : {},
        resource = _.result(this, 'resource');

    if (resource && this.length > 0) {
      this._cacheCollection(options);
    }
    else if (resource) {
      this._app.local.clear(resource);
    }
  } );

  // todo: the `remove` and `add` events are called once per each model what causes
  //       this method to reset the collection multiple times, if there was a way of
  //       knowing that a certain event is the last in a series of events fired then
  //       we could minimize the number of times we reset the collection local cache

  // info: don't need to listen for the `destroy` model event, because it will
  //       trigger a remove from the collection

  // listen to collection events and updates local caching accordingly
  this.on('add remove change', function() {
    var options = arguments.length > 0 ? arguments[arguments.length - 1] : {};

    this._cacheCollection(options);
  }, this);
  return collectionInitialize.apply(this, arguments);
};

var modelInitialize = Monaco.Model.prototype.initialize;
Monaco.Model.prototype.initialize = function() {
  this._cacheModel = function(options) {
    var data;

    // if original call IS NOT a fetch from local storage and this collection
    // should be cached
    if (this._app && !options.fromLocal &&
        (_.result(this, 'cacheLocal') === true || this._app.local.autoCache === true)) {

      // make sure the data has the same structure as the original server request
      data = ( this.revertParse && typeof this.revertParse === 'function' ) ? this.revertParse() : this.toJSON();

      // replace the local data with the new data
      this._app.local.set(this, data);
    }
  };

  // listen to collection events and updates local caching accordingly
  this.on('change', function() {
    var options = arguments.length > 0 ? arguments[arguments.length - 1] : {};

    this._cacheModel(options);
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
