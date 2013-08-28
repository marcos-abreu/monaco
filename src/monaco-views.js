(function(window){
    'use strict';

    var Monaco = window.Monaco = (window.Monaco || {});

    // todo: find a way to inherit from Monaco.View instead of Backbone.View
    Monaco.View = Monaco.View.extend({
        // application namespace
        namespace : 'views',

        // subviews associated with this view with options to help define 
        // and render each subview
        views : {},

        // all children view instances from a master view
        children: {},

        // override constructor function
        constructor : function() {
            // call the original constructor method
            Backbone.View.prototype.constructor.apply(this, arguments);
            
            // saves a referenec to this instance
            var _self = this;

            // instanciate each available subview
            _.each(this.views, this._subviewConstructor, this);

            // wrap the render method to work with subviews
            var render = this.render;
            this.render = function() {
                render.apply(_self, arguments);
                _self._subviewRender.apply(_self, arguments);
                this.trigger('rendered', this);
                return this;
            };

            // wrap the remove method to work with subviews
            var remove = this.remove || function() {};
            this.remove = function() {
                _self._subviewsRemove.apply(_self, arguments);
                remove.apply(_self, arguments);
                this.trigger('removed', this);
                return this;
            };
        },

        // Default render method that renders the template by appending it to the `el`
        render : function(data) {
            if ( this.template ) {
                data = _.extend(data, (this.collection ? this.collection.toJSON() : (this.model ? this.model.toJSON() : null)));
                if (this.$el) {
                    this.$el.append( this.template(data));
                } else {
                    // todo: render the template and return the html generated
                }
            }
            return this;
        },

        // create a subview instance
        _subviewConstructor : function(options, selector) {
            var ViewClass,
                params = {};

            options = options || {};
            ViewClass = (options.ViewClass || Monaco.View);

            if ((options.collection || this.collection) && !options.collectionItem) {
                params.collection = options.collection || this.collection;
            }
            if (options.model && this.model) {
                params.model = this.model;
            }
            if (options.template) {
                params.template = options.template;
            }

            // creates one subview for each model in the collection
            if ((options.collection || this.collection) && options.collectionItem) {
                this._subviewPerModelConstructor(selector, (options.collection || this.collection), options, params, ViewClass);

            // creates one subview
            } else {
                var view = new ViewClass(params);
                view.parent = this;
                this.children[selector] = view;
            }
        },

        // creates one subview per model in the collection, it also sets the master view
        // to handle events coming from the collection
        _subviewPerModelConstructor: function(selector, collection, options, params, ViewClass) {
            this.views[selector].suffix = options.suffix = (options.suffix || _.uniqueId('sfx'));
            var suffix = this[options.suffix] = {};
            suffix.addOne = function() {
                var args = Array.prototype.slice.call(arguments, 0);
                args.push({itemView: ViewClass, listWrapper: selector});
                return Monaco.ViewForModels.addOne.apply(this, args);
            };
            suffix.addAll = function() { 
                var args = Array.prototype.slice.call(arguments, 0);
                args.push({itemView: ViewClass, listWrapper: selector});
                return Monaco.ViewForModels.addAll.apply(this, args);
            };

            this.listenTo(collection, 'add', suffix.addOne);
            this.listenTo(collection, 'reset', suffix.addAll);

            collection.each(function(model) {
                params.model = model;
                var view = new ViewClass(params);
                view.parent = this;
                this.children[selector] = this.children[selector] || [];
                this.children[selector].push(view);
            }, this);
        },

        // Render each subview after the main view has been rendered. Your can
        // override this by passing `autoRender: false` as an option for the subview
        _subviewRender : function() {
            var _arguments = arguments;
            _.each(this.children, function(view, selector) {
                var options = this.views[selector];
                if (!_.has(options, 'autoRender') || options.autoRender === true) {
                    if ((options.collection || this.collection) && options.collectionItem) {
                        options.suffix.addAll((options.collection || this.collection), {}, {
                            itemView: options.ViewClass || Monaco.ViewClass,
                            listWrapper: selector
                        });
                    } else {
                        view.setElement(selector);
                        view.render.apply(view, _arguments);
                    }
                }
            }, this);
        },

        // Remove (DOM + Events) each subview before removing the main view
        _subViewRemove : function() {
            var _arguments = arguments;
            _.each(this.children, function(view, selector) {
                view.remove.apply(view, _arguments);
                var options = this.views[selector];
                if (this[options.suffix]) {
                    delete this[options.suffix];
                    // tood: clean-up any events that were set here
                }
            }, this);
        }

    });

    Monaco.ViewForModels = Monaco.View.extend({
        addOne : function(model, options, info) {
            var ViewClass = info.ItemView || this.ItemView;
            var view = new ViewClass( { model : model } );
            $( info.listWrapper || this.listWrapper ).append( view.render( model.toJSON() ).el );
        },

        addAll : function(collection, options, info) {
            options = options || {};
            if ( !options.keepValues ) {
                $( info.listWrapper || this.listWrapper ).html(''); //clear list
            }
            collection.each( function( obj ) {
                this.addOne( obj, options, info );
            }, this );
        }
    });
}(window));