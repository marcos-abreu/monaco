monaco-transitions
====

**monaco-transition** provides the engine to create your transitions based on your application requirements - you can use any technology to create your transitions, what this module does is to provide a consistent way you can start your transitions and manages your current view.

Transitioning Classes
----

Monaco comes with a simple `Monaco.Transition` class; and the same way you are supposed to extend `Monaco.View`, or `Monaco.Model` or `Monaco.Collection` to create your own views, models and collections; you should extend the `Monaco.Transition` class to create more specialized and sophisticated view transitions.

sample:

    var app = new Monaco.Application('mobile');
    app.add('PopupTransition', Monaco.Transition.extend({
        ...
    }));


When transitioning from one view to another the `start` method of the transition class will be called passing the `fromView`, `toView` and `options` parameters.

**start(fromView, toView, options)**

where:

**fromView** : *object* : Monaco view instance, already rendered. The current view.  
**toView** : *object* : Monaco view instance, not yet rendered. The target view.  
**options** : *object* : literal object with properties passed when the transition method is called.  


When creating your own transitions you most likely will be overriding this method to create your own implementation, defining how the app should go from one transition to the other.

The following is a simple example:

    var app = new Monaco.Application('mobile');
    app.add('PopupTransition', Monaco.Transition.extend({
        start : function(fromView, toView, options) {
            fromView.remove();
            toView.render(options);
            return toView;
        }
    }));

The code above is a really simple implementation that will close the `fromView` and render the `toView` with the options parameter. One important thing to notice is that **the `start` method should always return the view you will be considering the main view after the transition is done**; internally Monaco will keep track of this view and will expose a reference to it through the application instance as `app.currentView`

If you want to use a css transition you could do something like:

    var app = new Monaco.Application('mobile');
    app.add('PopupTransition', Monaco.Transition.extend({
        start : function(fromView, toView, options) {
            toView.render(options).hide();

            fromView.$el.addClass('fadeOut'); // css class that have the fade out transition
            toView.$el.addClass('fadeIn'); // css class that have the fade in transition

            //wait until the transitions finish and then close the fromView
            window.setTimeout( _.bind( function() {
                toView.$el.removeClass("fadeIn");
                fromView.remove();
            }, this ), 250 );

            return toView;
        }
    }));

Again the code above is a really simplistic implementation, but what it does is to render the `toView` and hide it, then it perform the css animation by adding the appropriate classes to the view elements; it then includes a function that will wait a quarter of a second (the same time the css animation will take to finish) and then clean up the toView class and close the fromView. By the end the method returns the toView.

Transitioning between Views
----

when **monaco-transitions** module is added a new method `transitionTo` is provided into the app instance to facilitate transition between the current view and the next view.

**Application.transitionTo(toView, options, TransitionClass)**

where:

**toView** : *object* : Monaco view instance that you are transitioning to
**options** : *object* : optional literal object with options that are passed to the transition `start` method
**TransitionClass** : *object* : optional Monaco transition class to be used

If no **TransitionClass** parameter is informed then the default Transition Class is used (either the one that comes with Monaco, or anyone you have defined as the default transition class.


sample:
    var app = new Monaco.Application('mobile');

    var videoList = new app.views.VideoList();
    app.transitionTo(videoList);

The code above creates a new view instance and instruct the app to transition to this newly created view using the default transition class.

sample:

    var app = new Monaco.Application('mobile');
    app.add('PopupTransition', Monaco.Transition.extend({
        start : function(fromView, toView, options) {
            ...
        }
    }));

    var videoList = new app.views.VideoList();
    app.transitionTo(videoList, {}, app.transitions.PopupTransition);

The code above creates a new view instance and instruct the app to transition to this newly created view using the `PopupTransition` class.
