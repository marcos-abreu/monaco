(function(window, _, Backbone){
    'use strict';

    var Monaco = window.Monaco = (window.Monaco || {});

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
                this.local.set({resource: key, models:[]}, value, options.prefetchedExpire);
            }, app);
            delete app.options.prefetched;
        }
    });

    // overrides Monaco.Application add method to check for the required `resources` property
    var applicationAdd = Monaco.Application.prototype.add;
    Monaco.Application.prototype.add = function(className, Class) {
        if (Class.prototype.namespace === 'collections' && (!Class.prototype.resource || Class.prototype.resource === '')) {
            throw new Error('required `resource` property missing from this collection definition');
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
                resource = collection ? _.result(collection, 'resource') : null;

            if (resource) {
                var data = this._getLocalData(resource);
                if (data) {
                    data.resp = this.decompress(data.resp);
                    if (!isCollection) {
                        data = _.find(data.resp, function(item) {
                            return item[obj.idAttribute] === obj.id;
                        });
                        if (data && (!data._ts || !this._isExpired(data))) {
                            delete data._ts; // remove possible timestamp property
                            return data;
                        }
                    } else {
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
                resource = collection ? _.result(collection, 'resource') : null;
            expire = (expire !== void 0) ? expire : false;

            if (!resource) {
                // todo: find a way to log  - 'unable to identify object\'s resource'
                return;
            }
            if (!collection) {
                //todo: find a way to log - 'unable to identify object\'s collection'
                return;
            }

            if (!isCollection) {
                // in case the model has expireLocal set for individual models
                var modelExpire = expire;
                if (modelExpire !== false || (modelExpire = _.result(obj, 'expireLocal')) !== void 0) {
                    data = this._setExpire(data, modelExpire, true);
                }
                data = this._addToCollectionData(obj, data, collection);
            }

            data = this.compress(data);
            data = this._setExpire(data, (expire !== false ? expire : _.result(collection, 'expireLocal')));

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
            var collectionData = this.get(collection);
            if (!collectionData) {
                collectionData = collection.toJSON();
            }
            var rejectObj = {};
            rejectObj[model.idAttribute] = model.id;
            collectionData = _.reject(collectionData, rejectObj);
            collectionData.push(data);
            return collectionData;
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

        // get the resource if iti is available in localStorage
        // returns the object or if the objec is not found null
        _storageGet : function(resource) {
            var result;
            try {
                result = window.localStorage.getItem(this._getKey(resource));
            } catch(e) {
                return null;
            }
            return (result === undefined || result === 'undefined' || result === null) ? null : JSON.parse(result);
        },

        // set the resource data in localStorage
        _storageSet : function(resource, data) {
            var key = this._getKey(resource),
                keys = window.localStorage.getItem('monaco-' + this._app.name + ':keys') || '{}';

            var newKeys = JSON.parse(keys);
            newKeys[key] = data._ts;
            try {
                window.localStorage.setItem('monaco-' + this._app.name + ':keys', JSON.stringify(newKeys));
                window.localStorage.setItem(key, JSON.stringify(data));
            } catch(e) {
                // todo: add a warning here
                try {
                    // reseting the keys to its origina value if either the newkeys or data failed
                    window.localStorage.setItem('monaco-' + this._app.name + ':keys', keys);
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
                window.localStorage.removeItem(key);
            } catch(e) {
                throw new Error('unable to remove the localStorage key: ' + key);
            }

            // remove the item from memory
            if ( _.has(this._memory, resource) ) {
                delete this._memory[resource];
            }

            // clean-up the application keys
            var keys = JSON.parse(window.localStorage.getItem('monaco-' + this._app.name + ':keys')) || {};
            delete keys[key];
            return this._app.set('monaco-' + this._app.name + ':keys', keys, true);
        },

        // clear all resources associated with this application from localStorage and memory
        _clearAll : function() {
            // clean up localStorage
            var keys = JSON.parse(window.localStorage.getItem('monaco-' + this._app.name + ':keys')) || {};
            _.each(keys, function(value, key) {
                try {
                    var resource = key.split('#');
                    resource = resource[1];
                    window.localStorage.removeItem(key);
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
        //       knowing that a certanin event is the last in a series of events fired then
        //       we could minimize the number of times we reset the collection local cache

        // info: don't need to listen for the `destroy` model event, because it will
        //       trigger a remove from the collection
        this.on('add remove change reset', function() {
            var options = arguments.length > 0 ? arguments[arguments.length - 1] : {};
            if (!options.fromLocal && 
                (_.result(this, 'cacheLocal') === true || this._app.local.autoCache === true)) {
                this._app.local.set(this, this.toJSON());
            }
        }, this);
        return collectionInitialize.apply(this, arguments);
    };

    /* -- SYNC ------------------------------------------------------------- */
    Monaco.sync = Backbone.sync;

    // override the Monaco (Backbone) sync method, so that read calls make
    // usage of the local caching data for Monaco Models or Collections
    Backbone.sync = function(method, model, options) {
        options = options || {};
        var app = model._app, // A Monaco Model or Collection will have a refrence to the application
            localOnly = (options.localOnly === true || model.localOnly === true);
        if (app && method === 'read') {
            // Attempt to retrive the data from local cache and if succeed it will call the appropriated success method
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
                    options.error({}, "Error: resource not found locally", {});
                }
                return;
            }
            // Check the configuration levels and wrap the success call back if at any level we have cacheLocal defined
            else if ((_.result(options, 'cacheLocal') === true) || // fetch level
                (!_.has(options, 'cacheLocal') &&  isCollection && _.result(model, 'cacheLocal') === true) || // model/collection level
                (!_.has(options, 'cacheLocal') && !isCollection && _.result(model.collection, 'cacheLocal') === true) || // model/collection level
                (!_.has(options, 'cacheLocal') && (!_.has(model, 'cacheLocal')) && app.local.autoCache === true)) { // app level
                var success = options.success;
                options.success = function(resp, status, xhr) {
                    app.local.set(model, resp, _.result(options, 'expireLocal'));
                    if (success) {
                        success.apply(this, arguments);
                    }
                };
            }
        }

        // return earlier for model/collections or request options set to localOnly
        if (localOnly === true) {
            return;
        }
        return Monaco.sync(method, model, options);
    };
}(window, window._, window.Backbone));
