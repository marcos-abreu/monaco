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
            transition = new TransitionClass(currentView, targetView);

        this.currentView = transition.start(options);
    };

    /* -- TRANSITION ------------------------------------------------------- */
    var Transition = Monaco.Transition = function(fromView, toView) {
        this.fromView = fromView;
        this.toView = toView;
        this.initialize.apply(this, arguments);
    };

    // extend the Monaco.Transition with Backbone.Events engine
    _.extend(Monaco.Transition.prototype, Backbone.Events, {
        namespace : 'transitions',

        // initialization - Override it with your own logic
        initialize : function() {},

        // execute the transition - override this method when creating custom transitions
        // returns the view that will be assigned to the application currentView
        start : function(options) {
            options = options || {};
            if (this.fromView && this.toView.el === this.fromView.el) {
                this.fromView.remove();
                this.toView.render(options);
            }
            else if (this.fromView) {
                this.toView.render(options);
                this.fromView.remove();
            } else {
                this.toView.render(options);
            }
            if (_.has(options, 'scrollTop')) {
                window.scrollTo(0, options.scrollTop);
            }
            return this.toView;
        }
    });

    Transition.extend = utils.extend;

}(window));