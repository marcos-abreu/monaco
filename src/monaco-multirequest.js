(function(window, _, Backbone){
    'use strict';

    var Monaco = window.Monaco = (window.Monaco || {});

    // override the collection constructor to assign a cid to every collection
    // we don't need to do the same for models, since models already have a cid
    var Collection = Monaco.Collection;
    Monaco.Collection = Collection.extend({
        constructor : function() {
            this.cid = _.uniqueId('c');
            Collection.prototype.constructor.apply(this, arguments);
        }
    });

    // global application method to simplify the multi fetch request call
    Monaco.Application.prototype.multiFetch = function(objects, options) {
        var pool = new Monaco.MultiRequest(objects);
        return pool.fetch(options);
    };

    // Manages multiple async fetch requests
    Monaco.MultiRequest = function(objects) {
        this._responses = {};
        this._requests = {};
        this._objects = [];
        this.cid = _.uniqueId('mr-');
        // this.id = null;

        this.beingAborted = false; // track if the multirequest is being aborted
        this.errorCalled = false; // track if the error callback was already called

        this.add(objects);
    };

    Monaco.MultiRequest.prototype = {
        // add objects (models/collections) to the internal list of objects
        add: function(objects) {
            objects = _.isArray(objects) ? objects : [objects];
            for (var i = 0, l = objects.length; i < l; i++) {
                this._objects.push(objects[i]);
            }

            // this.id = this.cid+'|'+_.size(this._objects);
        },

        // fetch all the internal objects tracking the result of each response
        // if one fails all remaining will be aborted and an optional error callback will be called
        // if all succeeds than an optional success callback will be called
        fetch: function(options) {
            var success = options.success,
                error = options.error;

            this.beingAborted = false;
            this.errorCalled = false;

            for (var i = 0, l = this._objects.length; i < l; i++) {
                var reqOptions = _.clone(options);
                reqOptions.multiRequest = (i+1)+'/'+this.id;

                reqOptions.success = _.bind(function(object, resp, options) {
                    if (!this.beingAborted) {
                        this._success.apply(this, arguments);
                        if (!options.fromLocal && _.size(this._requests) === 0 && success) {
                            return success.call(this, this._responses);
                        }
                    }
                }, this);

                reqOptions.error = _.bind(function() {
                    this._error.apply(this, arguments);
                    if (error) {
                        // make sure the error callback is just called once per multifetch call
                        if (this.beingAborted && !this.errorCalled) {
                            this.errorCalled = true;
                            return error.apply(this, arguments);
                        }
                    }
                }, this);

                // local cached fetch requests will return the boolean true immediately
                var result = this._objects[i].fetch(reqOptions);
                if (result && !_.isBoolean(result)) {
                    this._requests[this._objects[i].cid] = result;
                }
            }

            // if requests is empty, but responses are not, then call the success
            // this will happen when all responses came from local cache
            if (!this.beingAborted && _.size(this._requests) === 0 && _.size(this._responses) > 0 && success) {
                return success.call(this, this._responses);
            }

            return this;
        },

        // abort one request based on the object's cid or all requests if no cid is provided
        abort: function(cid) {
            var requests = {};
            if (cid && !this._requests[cid]) {
                throw new Error('invalid cid: ' + cid + ' - request not found!');
            } else if (cid) {
                requests[cid] = this._requests[cid];
            } else {
                requests = this._requests;
            }

            this.beingAborted = true;

            _.each(requests, function(request, key) {
                // abort fetch incomplete requests ( 4 === complete request )
                if (request.readyState !== 4) {
                    request.abort('stale');
                }

                // remove the request from the pool
                delete this._requests[key];
            }, this);
        },

        // wrapper success method for each fetch request, that will track the response
        // and properly manages the internal list of requests
        _success : function(object, resp, options) {
            options = options || {};

            // store the current response
            this._responses[object.cid] = {
                object: object,
                resp : resp,
                options : options
            };

            // if the data came from local cache, then no request was done so need
            // to remove it from the pool
            if (options.fromLocal === true) {
                return;
            }

            // remove the request from the pool
            delete this._requests[object.cid];
        },

        // wrapper error method for each fetch request, that will abort all
        // pending requests
        _error : function(object, resp, options) {
            // remove the request from the pool
            delete this._requests[object.cid];

            // abort all pending requests
            this.abort();
        }
    };
}(window, window._, window.Backbone));
