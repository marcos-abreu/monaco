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
