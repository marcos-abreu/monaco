(function(window){
    'use strict';

    var Monaco = window.Monaco = (window.Monaco || {}),
        utils = Monaco.utils = Monaco.utils || {};

    // Transition Application setup
    Monaco.on('app:built', function(app, options) {
        app.transitions    = {}; // transition list
    });

    // transition from currentView to targetView
    Monaco.Application.prototype.transitionTo = function(targetView, options, Transition) {
        if (!targetView) {
            throw new Error('missing target view');
        }

        var currentView = (this.currentView || null),
            TransitionClass = Transition || this.DefaultTransition || Monaco.Transition,
            transition = new TransitionClass();

        this.currentView = transition.start(currentView, targetView, options);
    };

    /* -- TRANSITION ------------------------------------------------------- */
    var Transition = Monaco.Transition = function(options) {
        this.initialize.apply(this, arguments);
    };

    // extend the Monaco.Transition with Backbone.Events engine
    _.extend(Monaco.Transition.prototype, Backbone.Events, {
        // application namespace
        namespace : 'transitions',

        // initialization - Override it with your own logic
        initialize : function() {},

        // execute the transition - override this method when creating custom transitions
        // returns the view that will be assigned to the application currentView
        start : function(fromView, toView, options) {
            options = options || {};
            if (fromView && toView.el === fromView.el) {
                fromView.remove();
                toView.render(options);
            }
            else if (fromView) {
                toView.render(options);
                fromView.remove();
            } else {
                toView.render(options);
            }
            return toView;
        }
    });

    Transition.extend = utils.extend;

}(window));