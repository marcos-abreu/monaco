(function(window, _, Backbone){
    'use strict';

    var Monaco = window.Monaco = (window.Monaco || {});

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
            
            // instanciate each available subview
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
            var remove = this.remove || function() {};
            this.remove = _.bind(function() {
                // remove the subviews first
                this._subviewsRemove.apply(this, arguments);
                // then remove the master view
                remove.apply(this, arguments);

                this.trigger('removed', this);
                return this;
            }, this);
        },

        // Default render method that renders the template by appending it to the views's element
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

        // adds a subview after this view has been instanciated
        // the parameter view should be on the same format you would include your views in a template
        add : function(view) {
            var keys = _.keys(view),
                selector = keys[0],
                options = view[selector];

            if (!selector || !options) {
                throw new Error('Invalid subview parameters');
            }
            this._subviewConstructor(options, selector);
        },

        // creates the necessary subview instance(s), storing their reference
        _subviewConstructor : function(options, selector) {
            var ViewClass,
                params = {};

            options = options || {};
            ViewClass = (options.ViewClass || Monaco.View);

            var collection = options.collection || this.collection;

            // sets the collection parameter if available
            if (collection && !options.collectionItem) {
                params.collection = collection;
            }
            // sets the model parameter if available
            if (options.model && this.model) {
                params.model = this.model;
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

            // wrap the generic addOne to inject the itemView and listWrapper properties
            this[suffix].addOne = function() {
                var args = Array.prototype.slice.call(arguments, 0);
                args.push({itemView: ViewClass, listWrapper: selector});
                return Monaco.ViewForModels.addOne.apply(this, args);
            };

            // wrap the generic addAll to inject the itemView and listWrapper properties
            this[suffix].addAll = function() { 
                var args = Array.prototype.slice.call(arguments, 0);
                args.push({itemView: ViewClass, listWrapper: selector});
                return Monaco.ViewForModels.addAll.apply(this, args);
            };

            // set the proper events so this view will be listening to the collection events
            // and acting acordingly
            this.listenTo(collection, ('add.' + suffix), this[suffix].addOne);
            this.listenTo(collection, ('reset.' + suffix), this[suffix].addAll);

            // for each model in the collection creates a new view with the passed parameters
            collection.each(function(model) {
                viewParams = _.clone(params);
                viewParams.model = model;
                var view = new ViewClass(viewParams);
                view.parent = this;
                this.children[selector] = this.children[selector] || [];
                this.children[selector].push(view);
            }, this);
        },

        // Render each subview after the main view has been rendered. Your can
        // override this by passing `autoRender: false` as an option for the subview
        _subviewsRender : function() {
            var _arguments = arguments;
            _.each(this.children, function(view, selector) {
                var options = this.views[selector];
                // check if the view should be rendered
                if (!_.has(options, 'autoRender') || options.autoRender === true) {

                    // render one view per collection model by using the `addAll` method
                    if ((options.collection || this.collection) && options.collectionItem) {
                        this[options.suffix].addAll((options.collection || this.collection), {}, {
                            itemView: options.ViewClass || Monaco.ViewClass,
                            listWrapper: selector
                        });
                    }
                    // render a single view
                    else {
                        view.setElement(selector);
                        view.render.apply(view, _arguments);
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
                    // remove each subview
                    for(var i = 0, l = view.length; i < l; i++) {
                        view[i].remove.apply(view, _arguments);
                    }

                    // removed event listeners
                    this.stopListening((options.collection || this.collection), 'add.' + options.suffix);
                    this.stopListening((options.collection || this.collection), 'reset.' + options.suffix);

                    // remove the suffix namespace
                    delete this[options.suffix];
                }
                // remove single view
                else {
                    view.remove.apply(view, _arguments);
                }
            }, this);

            // reseting the this.childrent to an empty object
            this.children = {};
        }

    });

    Monaco.ViewForModels = Monaco.View.extend({
        // adds one element to the set of elements by rendering the content of a model
        addOne : function(model, options, info, fromAddAll) {
            var ViewClass = info.ItemView || this.ItemView,
                view = new ViewClass( { model : model } ),
                content = view.render( model.toJSON() ).el;
            if (fromAddAll === true) {
                return content;
            }
            $( info.listWrapper || this.listWrapper ).append( content );
        },

        // adds one element per model based on a collection instance
        addAll : function(collection, options, info) {
            var result = [];
            options = options || {};
            if ( !options.keepValues ) {
                $( info.listWrapper || this.listWrapper ).html(''); //clear list
            }
            collection.each( function( obj ) {
                result.push(this.addOne( obj, options, info, true ));
            }, this );

            $( info.listWrapper || this.listWrapper ).append(result);
        }
    });
}(window, window._, window.Backbone));