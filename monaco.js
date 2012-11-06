// Framework to build on top of backbone
// Dependencies: backbone.js, underscore.js (preferably lo-dash)
// Compatible with: backbone-query-parameters
// Licence and Documentation at: ...
(function(root, undefined){

    // top level namespace
    var Monaco = root.Monaco = {};

    /* -- UTILITIES ------------------------------------------------------------ */

    // shared empty constructor function to aid in prototype-chain creation.
    var ctor = function(){};

    // clone of inherits method available on backbone through a closure
    var inherits = function(parent, protoProps, staticProps) {
        var child;
        if (protoProps && protoProps.hasOwnProperty('constructor')) {
            child = protoProps.constructor;
        } else {
            child = function(){ parent.apply(this, arguments); };
        }
        _.extend(child, parent);
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        if (protoProps) { _.extend(child.prototype, protoProps); }
        if (staticProps) { _.extend(child, staticProps); }
        child.prototype.constructor = child;
        child.__super__ = parent.prototype;
        return child;
    };

    // clone of extend method available on backbone
    var extend = function (protoProps, classProps) {
        var child = inherits(this, protoProps, classProps);
        child.extend = this.extend;
        return child;
    };

    Monaco.fetchCollections = function(collections, groupOptions) {
        var allResponses = {},
            requestQueue = [],
            success = groupOptions.success,
            errror = groupOptions.error;

        // success and error callbacks of each collection.fetch calls
        var complete = function(collection, resp, options) {
            allResponses[collection.resource] = {
                collection: collection,
                resp : resp,
                options : options
            };

            if (resp._origin && resp._origin === 'local') {
                return;
            }

            // failure
            if ((resp.readyState && resp.status) && (resp.readyState != 4 && resp.status !== 200)) {
                _.each(requestQueue, function(req, index, queue) {
                    req.abort();
                }, this);

                if (error) {
                    return error(collection, resp);
                }

            // success
            } else {
                requestQueue = _.filter(requestQueue, function(item) { 
                    return (item.resource !== collection.resource);
                });
                if (_.size(requestQueue) <= 0 && success) {
                    return success(allResponses);
                }
            }
        };

        groupOptions.success = complete;
        groupOptions.error = complete;

        var cid = _.uniqueId('mf-'),
            mfId = cid+'|'+_.size(collections);

        _.each(collections, function(collection, index, collections) {
            var fetchOptions = _.clone(groupOptions);
            fetchOptions.multiFetch = (index+1)+'/'+mfId;

            requestQueue.push(collection.fetch(fetchOptions));

            var lastItem = requestQueue.length - 1;
            // if data from local caching
            if (requestQueue[lastItem] === true) {
                requestQueue = requestQueue.slice(0, -1);
            } else {
                requestQueue[lastItem].resource = collection.resource;
            }
        }, this);

        // in case all requests came from local caching
        if ((_.size(requestQueue) === 0) && (success)) {
            return success(allResponses);
        }
    };

    /* -- EVENT AGREGATOR ------------------------------------------------------ */
    Monaco.dispatcher = _.extend({cid : "dispatcher"}, Backbone.Events);

    /* -- APPLICATION ---------------------------------------------------------- */
    // Application Structure
    var Application = Monaco.Application = function(options) {
        this.model      = {};        // model list
        this.collection = {};        // collection list
        this.view       = {};        // views list
        this.transition = {};        // view transition list

        this.options = options || {};

        Monaco.dispatcher.trigger('application:build', this, this.options);
    };

    Application.prototype.start = function(options) {
        options = options || {};
        options.pushState = options.pushState || false;
        if (!_.has(this, 'Router')) {
            throw new Error("missing router definition");
        }
        this.router = new this.Router();
        Backbone.history.start({pushState: options.pushState});
    };

    Application.prototype.transitionTo = function(targetView, options, Transition) {
        if (!targetView) {
            throw new Error('missing target view');
        }
        var currentView = this.currentView || null;
        Transition = Transition || this.DefaultTransition || Monaco.Transition;
        var transition = new Transition(currentView, targetView);
        this.currentView = transition.start(options);
    };


    /* -- ROUTER --------------------------------------------------------------- */
    // extended backbone router class

    Monaco.Router = Backbone.Router.extend({
        constructor : function() {
            var initialize = this.initialize,
                _self = this;
            this.initialize = function() {
                _self._bindRegExRoutes();
                initialize.apply(_self, arguments);
            };
            Backbone.Router.prototype.constructor.apply(this, arguments);
        },

        // Bind all defined regExRoutes to `Backbone.history`. We have to reverse the
        // order of the routes here to support behavior where the most general
        // routes can be defined at the bottom of the route map.
        _bindRegExRoutes : function() {
            if (!this.regExRoutes) return;
            var routes = [];
            for (var route in this.regExRoutes) {
                routes.unshift([route, this.regExRoutes[route]]);
            }
            var reParams = '([\\?]{1}.*)?';
            for (var i = 0, j = routes.length; i < j; i++) {
                var key = routes[i][0],
                    method = _.isArray(routes[i][1]) ? routes[i][1][0] : routes[i][1];
                // add query string pattern to each route // todo verify what to do if this isn't the case
                var re = key.slice(-1) == '$' ? key.slice(0, -1)+reParams+'$' : key+reParams;
                this.route(new RegExp(re), method);
            }
        }
    });

    /* -- COLLECTION ----------------------------------------------------------- */
    // extended backbone collection class

    Monaco.Collection = Backbone.Collection.extend({
        fetch : function(options) {
            options = options || {};
            options.error = options.error || Monaco.Router.defaultError || void 0;
            return Backbone.Collection.prototype.fetch.apply(this, arguments);
        }
    });

    /* -- MODEL ---------------------------------------------------------------- */
    // extended backbone model class

    Monaco.Model = Backbone.Model.extend({
        fetch : function(options) {
            options = options || {};
            options.error = options.error || Monaco.Router.defaultError || void 0;
            return Backbone.Model.prototype.fetch.apply(this, arguments);
        }
    });

    /* -- VIEW ----------------------------------------------------------------- */
    // extended backbone view class

    Monaco.View = Backbone.View.extend({

        views : null,

        constructor : function() {
            Backbone.View.prototype.constructor.apply(this, arguments);
            this.children = [];
            var _self = this;
            var render = this.render;
            this.render = function() {
                render.apply(_self, arguments);
                _self._render.apply(_self, arguments);
                this.trigger('rendered', this);
                return this;
            };
            var close = this.close || function() {};
            this.close = function() {
                _self._close.apply(_self, arguments);
                close.apply(_self, arguments);
                this.trigger('closed', this);
                return this;
            };
        },

        // loops over the subviews creating/rendering them depending on the options passed
        // each sub-view item have: [0] - view element; [1] - view template ; [3] - options (optional) as follow:
        //          autoCreate - automatically creates the subview || true by default
        //          autoRender - automatically renders the subview || true by default
        //          viewClass - the class used to create the view  || Monaco.View by default
        _render : function() {
            var _arguments = arguments,
                autoCreate = _.has(this, 'autoCreate') || true;
            _.each(this.views, function(item, index, views) {
                var options = item[3] || {};
                if (!_.has(options, 'autoCreate') || options.autoCreate === true) {
                    var viewClass = options.viewClass || Monaco.View;
                    var View = viewClass.extend({
                        template : item[1]
                    });
                    var view = new View({
                        el: item[0]
                    });
                    this.children.push(view);
                    view.parent = this;
                    if (!_.has(options, 'autoRender') || options.autoRender === true) {
                        view.render.apply(view, _arguments);
                    }
                }
            }, this);
        },

        // default render method that renders the template by appending it to the `el`
        render : function(data) {
            data = data || (this.collection ? this.collection.toJSON() : (this.model ? this.model.toJSON() : null));
            $(this.el).append(this.template(data));
            return this;
        },

        // loops over any known sub view rendered and attempts to close them by using their
        // repsective close methods
        _close : function() {
            var _arguments = arguments;
            _.each(this.children, function(view) {
                view.close.apply(view, _arguments);
            }, this);
        },

        // remove view's DOM elements and unbind events linked with it
        // http://lostechies.com/derickbailey/2011/09/15/zombies-run-managing-page-transitions-in-backbone-apps/
        close : function() {
            this.dispose();
            $(this.el).empty(); // remove all child nodes - jQuery dependent
        }
    });

    /* -- LOCAL CACHE ---------------------------------------------------------- */
    // manage local caching (memory and localStorage)

    Monaco.dispatcher.bind('application:build', function(app, options) {
        options = options || {};
        if (options.prefetched) {
            _.each(options.prefetched, function(value, key) {
                Monaco.local.set({ resource : key , models : []}, value);
            }, this);
            delete options.prefetched;
        }
        if (_.has(options, 'cacheLocal')) {
            Monaco.local.autoCache = Boolean(options.cacheLocal);
        }
        if (_.has(options, 'defaultExpire')) {
            Monaco.local.defaultExpire = options.defaultExpire;
        }
    });

    Monaco.local = {

        autoCache : false,

        defaultExpire : 30, // default expiration time in minutes

        get : function(obj) {
            var isCollection = _.has(obj, 'models'),
                resource = (obj.resource || obj.collection.resource || null),
                data = (isCollection ? this._getCollectionData(resource, true) : this._getModelData(resource, obj));
            if (data) {
                return (isCollection ? this.decompress(data.resp) : data);
            }
            return false;
        },

        set : function(obj, data, expire) {
            var isCollection = _.has(obj, 'models'),
                resource = obj.resource || obj.collection.resource || null,
                localData = null;

            if (isCollection) {
                localData = _.clone(data);
                localData = this.compress(localData);
            } else {
                var collectionData = this._getCollectionData(resource, false);
                if (collectionData) {
                    localData = decompress(collectionData.resp);
                    this._addToCollection(localData, data);
                } else {
                    return false;
                }
            }

            localData = this._setExpireTime(localData, expire);
            this._storageSet(resource, 'data', localData);
            if (isCollection || this._memoryHas(resource)) {
                this._memorySet(resource, localData);
            }
            return true;
        },

        // overwrite this method with your own implementation of data compression
        compress : function(data) {
            return data;
        },

        // overwrite this method with your own implementation of data decompression
        decompress : function(data) {
            return data;
        },

        // clear Monaco.local data from memory and local storage
        clear : function(name, type) {
            var keyList;

            // removes one item (name#type) from the cached resources
            if (name) {
                // remove the itme from local storage
                var key = this._getKey((type || 'data'), name);
                root.localStorage.removeItem(key);

                // update monaco's key list
                if (arguments.length === 3) {
                    // used on recursive calls
                    keyList = arguments[2];
                } else {
                    keyList = JSON.parse(root.localStorage.getItem('monaco:keys')) || [];
                }
                keyList = _.without(keyList, key);
                if (keyList.length === 0) {
                    root.localStorage.removeItem('monaco:keys');
                } else {
                    root.localStorage.setItem('monaco:keys', JSON.stringify(keyList));
                }

                // remove the item from memory
                if (this._memoryHas(name)) {
                    delete Monaco._memory[name];
                }
                return keyList;
            }

            // removes all resources cached by monaco
            else {
                keyList = JSON.parse(root.localStorage.getItem('monaco:keys')) || [];
                var resource = null,
                    currentList = keyList;
                for (var i = 0, j = keyList.length; i < j; i++) {
                    resource = keyList[i].split('#');
                    currentList = this.clear.call(this, resource[1], resource[0], currentList);
                }
                Monaco._memory = {};
            }
        },

        _storageGet : function(name, type) {
            console.log('## look-up : local storage');
            var result = root.localStorage.getItem(this._getKey((type || 'data'), name));
            return (result === undefined || result == "undefined" || result === null) ? null : JSON.parse(result);
        },

        _storageSet : function(name, type, data) {
            console.log('## data set : storage');
            // set monaco's key list
            var key = this._getKey((type || 'data'), name),
                keyList = JSON.parse(root.localStorage.getItem('monaco:keys')) || [];
            if (keyList.indexOf(key) < 0) {
                keyList.push(key);
            }
            root.localStorage.setItem('monaco:keys', JSON.stringify(keyList));

            // set the item
            root.localStorage.setItem(key, JSON.stringify(data));
        },

        _memoryGet : function(resource) {
            console.log('## look-up : memory');
            return (Monaco._memory) ? Monaco._memory[resource] : null;
        },

        _memorySet : function(resource, data) {
            console.log('## data set : memory');
            Monaco._memory = {};
            Monaco._memory[resource] = data;
        },

        _memoryHas : function(resource) {
            return (Monaco._memory && Monaco._memory[resource]);
        },

        _setExpireTime : function(data, expire) {
            var timestamp = null;
            if (!_.isNull(expire)) {
                var date = new Date();
                date.setMinutes(date.getMinutes() + (expire || this.defaultExpire));
                timestamp = date.getTime();
            }
            return {
                timestamp : timestamp,
                resp : data
            };
        },

        _isExpired : function(data) {
            var expire = data.timestamp,
                now = new Date();
            return (!_.isNull(expire) && now.getTime() > expire);
        },

        /*
         * tries to get a collection data from any available caching layer (memory/localStorage)
         *
         * @param   string      resource            resource used to create the entry key
         * @param   boolean     collectionLookup    flag indicating if this method is being called 
         *                                          direct from a collection look-up or not
         * @return  mixed                           an object with collection data if it is found and
         *                                          data is not expired; null otherwise
         */
        _getCollectionData : function(resource, collectionLookup) {
            var caching = ['memory', 'storage'];

            for (var i = 0, j = caching.length; i < j; i++) {
                var localData = this['_'+caching[i]+'Get'](resource);
                if (localData && !this._isExpired(localData)) {
                    if (caching[i] == 'storage' && collectionLookup) {
                        this._memorySet(resource, localData);
                    }
                    return localData;
                }
            }

            return null;
        },

        /*
         * tries to get a model data from any available caching layer (memory/localStorage)
         *
         * @param   string      resource            resource used to create the entry key
         * @param   object      model               model object containing at least the id attribute
         * @return  mixed                           an object with collection data if it is found and
         *                                          data is not expired; null otherwise
         */
        _getModelData : function(resource, model) {
            // This implementation is limited to collection responses containing array of model items
            // or to collection responses as an object where a key matching with the collection resource
            // name has an array of model items
            var localCollection = this._getCollectionData(resource, false),
                localData = null;
            if (localCollection) {
                localData = _.find((local.resp.resource || local.resp), function(item) {
                    return item.id === model.attributes.id;
                }, this);
            }
            return localData;
        },

        _addToStorage : function(resource, model, data) {
            var existing = this._getStorage(resource);
            if (existing) {
                var id = model.idAttribute;
                console.log(existing);
                // TODO
            }
        },

        _getKey : function(type, name) {
            if (!type || !name) {
                throw new Error("local cache: invalid type [" + type + "] or name [" + name + "]");
            }
            return type + '#' + name;
        }
    };

    /* -- SYNC ----------------------------------------------------------------- */
    // Backbone sync method

    Monaco.sync = Backbone.sync;

    Backbone.sync = function(method, model, options) {
        options = options || {};

        if (method == 'read') {
            data = (options.fresh === true) ? null : Monaco.local.get(model);
            if (data) {
                data._origin = 'local';
                if (options.success) {
                    options.success(data);
                }
                return true;
            }

            if ( (  options.cacheLocal === true) || 
                 (! _.has(options, 'cacheLocal') && model.cacheLocal === true) ||
                 (! _.has(options, 'cacheLocal') && ! _.has(model, 'cacheLocal') && Monaco.local.autoCache === true)) {

                var success = options.success,
                    obj = model;
                options.success = function(resp, status, xhr) {
                    Monaco.local.set(obj, resp);
                    if (success) {
                        success.apply(this, arguments);
                    }
                };
            }
        }

        console.log('## ajax call');
        return Monaco.sync(method, model, options);
    };

    /* -- FORM ----------------------------------------------------------------- */
    // manage forms

    var Form = Monaco.Form = function(selector, modelClass) {
        if (!selector) {
            throw new Error('undefined form selector');
        }
        this.selector = selector;
        this.modelClass = modelClass;
        this.attributes = {};
        this.serializeAttributes();
        this.initialize.apply(this, arguments);
    };

    _.extend(Form.prototype, Backbone.Events, {
        // initialize is an empty function by default. Override it with your own
        // initialization logic.
        initialize : function() {},

        // serialize form fields into an object with key/value attrbibutes
        serializeAttributes : function() {
            var data = $(this.selector).serializeArray();
            _.each(data, function(item) { 
                this.attributes[item.name] = item.value; 
            }, this);
        },

        // validate form against required and field types
        // @param   options     object options to be used in this method
        // @param   context     optional context to be applied on a success or 
        //                      error methods if avaialble in options
        validate : function(options, context) {
            this.serializeAttributes();

            // validate required fields
            for (var i = 0, j = this.required.length; i < j; i++) {
                var field = this.required[i];
                if (this.attributes[field] === "" && options.error) {
                    var exception = new apiException({'error': (field + ' is a required field'), 'field': field});
                    options.error.call((context || this), this, exception);
                    return false;
                }
            }

            // todo: validate required conditionals

            // todo: validate defined types - might be a good idea to trigger the model validation if available

            if (options.success) {
                var model = this.attributes;
                if (this.modelClass) {
                    model = new this.modelClass(this.attributes);
                    // todo handle errors on model validation if needed
                }
                options.success.call((context || this), model);
            }
        }
    });

    /* -- TRANSITION ----------------------------------------------------------- */
    // manage view transitions

    var Transition = Monaco.Transition = function(fromView, toView) {
        this.fromView = fromView;
        this.toView = toView;
        this.initialize.apply(this, arguments);
    };

    // extend the Monaco.Transition with Backbone.Events engine
    _.extend(Monaco.Transition.prototype, Backbone.Events, {

        // initialization - Override it with your own logic
        initialize : function() {},

        // execute the transition - override this method when creating custom transitions
        // the basic workflow is:
        //      append the target view (B) to the page, by rendering the targetView
        //      transition from A (current view) to B (target view)
        //      close current view A
        //      return the new view (!important)
        start : function(options) {
            options = options || {};
            this.toView.render(options);
            if (this.fromView) {
                this.fromView.close();
            }
            if (_.has(options, 'scrollTop')) {
                document.body.scrollTop = options.scrollTop;
            }
            return this.toView;
        }
    });

    Application.extend = Form.extend = Transition.extend = extend;

    // Certain Android devices are having issues when a JSON.parse(null) call is executed.
    // the following should fix this bug 
    JSON.originalParse = JSON.parse;
    JSON.parse = function(text) {
        if (text) {
            return JSON.originalParse(text);
        }
        return null;
    };
}(window));
