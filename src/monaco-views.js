(function(window){
    var Monaco = window.Monaco = (window.Monaco || {});

    Monaco.View = Backbone.View.extend({
        namespace : 'views',

        // Object containing the subviews associated with this view.
        // Every key should be set to a view class name, and its value should
        // be set to an object with initialization options. e.g:
        // views : { 'SubViewClass' : { model: myModel } }
        views : null,

        // override constructor function
        constructor : function() {
            Backbone.View.prototype.constructor.apply(this, arguments);
            this.children = []; // array of subviews instances
            var _self = this;

            // automatically create subviews instances, you can override this
            // by passing `autoCreate: false` as an option for the subview
            _.each(this.views, function(options, selector){
                options = options || {};
                if (!_.has(options, 'autoCreate') || options.autoCreate === true) {
                    var ViewClass = options.ViewClass || Monaco.View;

                    var View = ViewClass.extend({
                        template : options.template
                    });

                    var view = new View(options);
                    view.parent = this;
                    view._selector = selector;
                    this.children.push(view);
                }
            }, this);

            // wrap the render method to work with subviews
            var render = this.render;
            this.render = function() {
                render.apply(_self, arguments);
                _self._render.apply(_self, arguments);
                this.trigger('rendered', this);
                return this;
            };

            // wrap the remove method to work with subviews
            var remove = this.remove || function() {};
            this.remove = function() {
                _self._remove.apply(_self, arguments);
                remove.apply(_self, arguments);
                this.trigger('removed', this);
                return this;
            };
        },

        // Render each subview after the main view has been rendered. Your can
        // override this by passing `autoRender: false` as an option for the subview
        _render : function() {
            var _arguments = arguments;
            _.each(this.children, function(view) {
                if ( view._selector ) {
                    view.setElement(view._selector);
                }
                if (!_.has(view.options, 'autoRender') || view.options.autoRender === true) {
                    view.render.apply(view, _arguments);
                }
            });
        },

        // Default render method that renders the template by appending it to the `el`
        render : function(data) {
            if ( this.template ) {
                data = data || (this.collection ? this.collection.toJSON() : (this.model ? this.model.toJSON() : null));
                $(this.el).append( this.template(data) );
            }
            return this;
        },

        // Remove (DOM + Events) each subview before removing the main view
        _remove : function() {
            var _arguments = arguments;
            _.each(this.children, function(view) {
                view.remove.apply(view, _arguments);
            });
        },
    });
}(window));