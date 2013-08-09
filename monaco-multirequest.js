(function(window){
    var Monaco = window.Monaco = (window.Monaco || {});

    var RequestPool = function() {
        this._pool = {};
        this.size = 0;
    };

    RequestPool.prototype = {
        // push a request object into the request pool
        push : function(key, item) {
            if(!_.has(this.pool, key)) {
                // only increment the size if the item is not already in the pool
                this.size++;
            }
            this._pool[key] = item;
            return this._pool[key];
        },

        // remove a request object from the request pool
        remove : function(key) {
            if(_.has(this._pool, key)) {
                this.size--;
                var item = this._pool[key];
                delete this._pool[key];
                return item;
            }
            return false;
        },

        // get a request object from the request pool without removing it
        get : function(key) {
            if(_.has(this._pool, key)) {
                return this._pool[key];
            }
            return false;
        },

        // clears the request pool of any pending requests.
        // will not abort any dangerous requests (delete, update, etc)
        abortAll : function() {
            _.each(this.keys(), function(key, index) {
                var item = this._pool[key];
                if(_.has(item, 'type') && item.type === 'read' && (item.XHR.read.readyState !== 4)) {
                    this.remove(key).XHR.read.abort('stale');
                }
                else {
                    this.remove(key);
                }
            }, this);
            return this.keys();
        },

        // get the list of request keys on the pool
        keys : function() {
            return _.keys(this._pool);
        }
    };

    Monaco.fetchCollections = function(collections, groupOptions) {
        var allResponses = {},
            requestQueue = [],
            success = groupOptions.success,
            errror = groupOptions.error;

        // cleanup any pending ajax requests
        if( app.requestPool.size > 0) {
            app.requestPool.abortAll();
        }
        // add requests to pool
        _.each(collections, function(collection, index, collections) {
            app.requestPool.push(_.result(collection, 'resource'), collection);
        }, this);

        // success and error callbacks of each collection.fetch calls
        var complete = function(collection, resp, options) {
            allResponses[_.result(collection, 'resource')] = {
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
                    return (_.result(item, 'resource') !== _.result(collection, 'resource'));
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

        _.each(app.requestPool.keys(), function(key, index) {
            var collection = app.requestPool.get(key);
            if(collection !== false) {
                var fetchOptions = _.clone(groupOptions);
                    // console.log(key);
                    // console.log(collection);
                fetchOptions.multiFetch = (index+1)+'/'+mfId;

                requestQueue.push(collection.fetch(fetchOptions));

                var lastItem = requestQueue.length - 1;
                // if data from local caching
                if (requestQueue[lastItem] === true) {
                    requestQueue = requestQueue.slice(0, -1);
                } else {
                    requestQueue[lastItem].resource = _.result(collection, 'resource');
                }
            }
        }, this);

        // in case all requests came from local caching
        if ((_.size(requestQueue) === 0) && (success)) {
            return success(allResponses);
        }
    };

    var Application = Monaco.Application;
    Monaco.Application = function(options) {
        this.requestPool = new RequestPool();
        Application.apply(this, arguments);
    };
    Monaco.Application.prototype = Application.prototype;

    var sync = Monaco.sync;

    Monaco.sync = function( method, model, options ) {
        options = options || {};
        var key = _.result( model, 'resource' ) || _.result( model.collection, 'resource' ),
            app = model._app; // A Monaco Model or Collection will have a refrence to the application

        if ((app.requestPool.size > 0) && (typeof app.requestPool.get(key) === 'undefined')) {
            // if the request is already present, then it's a multiFetch and 
            // any pending requests have already been aborted and
            // any requests in the pool are part of the current multiFetch
            if (options.abortPending === true) {
                var result = app.requestPool.abortAll();
                if (result === false) {
                    throw new Error('request cannot be aborted (dangerous operation to cancel)');
                }
            }
        }

        if (method == 'read') {
            var success = options.success;
            options.success = function(data) {
                if (data._origin === 'local') {
                    app.requestPool.remove(key);
                }
                success.apply(this, arguments);
            };

            var complete = function(func) {
                app.requestPool.remove(key);
                if (func) {
                    params = Array.prototype.slice.call(arguments);
                    params.shift();
                    return func.apply(this, params);
                }
            };

            options.success = _.wrap(options.success, complete);
            options.error   = _.wrap(options.error, complete);
        }

        var syncResult = sync.apply(this, arguments);
        if (!options.localOnly) {
            var request = app.requestPool.push(key, {type: method, XHR:{}});
            request.XHR[method] = syncResult;
        }
        return syncResult;
    };
}(window));
