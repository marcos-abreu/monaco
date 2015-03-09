(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['lodash', 'backbone', 'storage'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('lodash'), require('backbone'), require('storage'));
  } else {
    root.Monaco = factory(root._, root.Backbone, root.localStorage);
  }
}(this, function(_, Backbone, localStorage) {
// make sure monaco is defined as the main object
var Monaco = this.Monaco = (this.Monaco || {});

var array = [];
var slice = array.slice;

/*
 * View Manager Constructor
 */
var ViewManager = Monaco.ViewManager = function(parent, options) {
  // manager options
  this.options = options || {};

  // internal sub-views object
  this._children = {};

  // when a parent is informed it will manage the subviews according to
  // parent's events
  // this method uses the parent, but DOES NOT keep a reference to it
  if (parent && parent instanceof Monaco.View) {
    this.listenTo(parent, 'rendered', this._onParentRender);
    this.listenTo(parent, 'beforeRemove', this._onParentRemove);
  }
};

/*
 * View Manager extended methods
 */
ViewManager.prototype = _.extend(ViewManager.prototype, {

  /*
   * Handler triggered after parent view is rendered
   *    - when developer didn't specifically state that subviews shouldn't be auto-rendered
   *    - when subview key matches a valid parent selector
   */
  _onParentRender: function(parent) {
    if (this.options.autoRender !== false) {
      this.each(function(child, key) {
        var $selector = parent.$el.find(key);
        if ($selector.length > 0) {
          $selector.html( child.render().$el );
        }
      }, this);
    }
  },

  /*
   * Handler triggered just before the parent view is removed the DOM
   */
  _onParentRemove: function() {
    // this will invoke the 'remove' method of each child view
    this.invoke( 'remove' );
  },

  /*
   * Handler triggered after a child has been removed from the DOM
   */
  _onChildRemove: function(instance) {
    // removes the reference to the dead instance
    var name = this.find(this._children, {cid: instance.cid});
    if (name) {
      this._children[name] = void 0;
    }
  },

  /*
   * internal method that adds a child view to this manager
   */
  _addChild: function(name, instance) {
    if (this._children[name]) {
      this._children[name].remove();
    }

    this._children[name] = instance;
    this.listenTo(this._children[name], 'remove', this._onChildRemove);
    return this._children[name];
  },

  /*
   * public method to add a child view to this manager
   */
  add: function(name, instance) {
    var children = {};

    if (typeof name === 'string' && name !== '' && instance instanceof Monaco.View) {
      children[name] = instance;
    }
    else if (typeof name === 'object') {
      children = name;
      instance = name; // return value
    }
    else {
      throw new Error('Monaco.ViewManager :: invalid parameters when setting subviews');
    }

    _.each(children, function(value, key) {
      if (typeof key === 'string' && key !== '' && value instanceof Monaco.View) {
        this._addChild(key, value);
      }
    }, this );

    // returns instance being set, or in case of bulk set returns original object
    return instance;
  },

  /*
   * public method to set a child view to this manager (`add` shortcut)
   */
  set: function() {
    return this.add.apply(this, arguments);
  },

  /*
   * public method to get a child from this manager
   */
  get: function(name) {
    return this._children[name];
  }
});

// Mix in each Underscore method as a proxy to View#sub-views
var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'shuffle', 'isEmpty', 'chain', 'sample',
    'partition'];

_.each(methods, function(method) {
  if (!_[method]) {
    return;
  }
  ViewManager.prototype[method] = function() {
    var args = slice.call(arguments);
    args.unshift(this._children);
    return _[method].apply(_, args);
  };
});

var View = Monaco.View;
Monaco.View = View.extend({

  // constructor
  constructor: function(options) {
    options = options || {};

    // call the original constructor method
    View.prototype.constructor.apply(this, arguments);

    // create a subviews from ViewManager
    this.subviews = new Monaco.ViewManager(this, options);

    // overrides the view render to trigger an event
    var render = this.render;
    this.render = _.bind(function monacoViewRender() {
      var result;

      // call the original render caching the result;
      result = render.apply(this, arguments);

      if (Promise && result instanceof Promise) {
        return result.then( function( view ) {
          view.trigger('rendered', view);
        } );
      }
      else {
        this.trigger('rendered', this);
        return result;
      }
    }, this);

    // overrides the view remove to trigger an event
    var remove = this.remove;
    this.remove = _.bind(function monacoViewRemove() {
      var result;

      this.trigger('beforeRemove', this);
      // call the original remove caching the result;
      result = remove.apply(this, arguments);

      if (Promise && result instanceof Promise) {
        return result.then( function( view ) {
          view.trigger('rendered', view);
        } );
      }
      else {
        this.trigger('removed', this);
        return result;
      }
    }, this);
  }

});


return Monaco;
}));
