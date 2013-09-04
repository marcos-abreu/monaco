Getting Started
====

The ***Monaco*** framework is based on [*Backbonejs*](http://backbonejs.org/), and therefore it has all of the features available in it, but it also extend it to make your development more pleasant and productive, with a range of new functionality.

***Monaco*** follows the same concepts of *Backbonejs*, where you create routes that when matched by the current url will trigger a function responsible for collecting data, processing it; and instantiating an object that can present the data on the user screen.

The main concepts of *Backbonejs* are *Router*, *Model*, *Collection*, *View*, and *Event*. ***Monaco*** extends each one of those elements adding its own functionality to them, and also expose new ones, such as: *Application*, *Transition*, *Local*. Please check the [platform overview doc](/docs/plataform-overview.md) for more details.

Loading your assets
----

The first thing you need in order to run your application is to load the necessary scripts in an HTML page (you will need a server capable of serving HTML files and necessary assets):

    <html>
        <head>
            <title>your application</title>
        </head>

        <body>
            ...
            
            
            <!-- faramework and its dependencies -->
            <script src="http://yourdomain.com/scripts/underscore.js"></script>
            <script src="http://yourdomain.com/scripts/backbone.js"></script>
            <script src="http://yourdomain.com/scripts/monaco.js"></script>

            <!-- application files -->
            <script src="http://yourdomain.com/scripts/your-app.js"></script>
        </body>
    </html>

***Monaco***'s requirements are [*Backbonejs*](http://backbonejs.org/), and backbone's only hard requirement [*underscorejs*](http://underscorejs.org/). But you can use the [*lodash*](http://lodash.com/) instead of [*underscorejs*](http://underscorejs.org/), in my tests it performs better.

Backbone's only hard dependency is Underscore.js ( > 1.3.1). 
For RESTful persistence, history support via Backbone.Router and DOM manipulation
with Backbone.View, include json2.js, and either jQuery ( > 1.4.2) or Zepto.


Backbone doesn't have a hard dependency on a DOM library, but for RESTful persistence (XHR Requests), history support (Backbone.History) and DOM manipulation (Backbone.View) it does depend on a library with those capabilities. Currently, it lists [*jQuery*](http://jquery.com/), [*zepto*](http://zeptojs.com/) and [*ender*]() as supported DOM libraries you can use. Since ***Monaco*** is build on top of *Backbonejs*, the same premises holds true when using this framework. If your application needs a DOM library then include the request for it before the requests for the framework and its dependencies.

The last script on the example above is your application script, in our example called `your-app.js`, where you will include all the logic of your application. Your application will probably be divided into multiple files, but you should use a deployment process capable of combining and minifying them into one file in order to minimize the number of requests.


Application workflow
----

A common workflow for front-end application is:

- create the application object
- add routes, controllers, models, collections, views (including their template files)
- configuring your application
- starting your application

What follows is an explanation of each step of this workflow, this should help you understand how to build a simple application.

### Creating a Monaco Application

Creating a ***Monaco*** application is really easy, you just need to create a new instance of the `Monaco.Application` class:

    var app = new Monaco.Application('mobile');

For all the options you can use when creating an application please check the [**monaco-application** doc](/docs/modules/monaco-application.md).

### Adding Routes

When adding routes to an application use the `add` method from your router instance.

    // adding regex routes
    app.router.add({
        'users/:id'                : ['userProfile', { regexp: {id: /\d+/} }],
        'users/:id/videos'         : ['userVideos',  { regexp: {id: /\d+/} }]
    });

In the code above it was used regex routes from the [**monaco-router**](/docs/modules/monaco-router.md) module. If you don’t need advanced routes functionality, then you can use simple routes:

    // adding simple routes
    app.router.add({
        'users/:id'                : 'userProfile',
        'users/:id/videos'         : 'userVideos'
    });


Both examples will register a list of urls that will be used when the user navigates (using the `navigate` method of the application router instance) to a different url; for the first matched route its related controller method will be called.

The difference between those two examples is that the first one will just match numeric values as id, while the second example any character used will be recognized.

Check the [platform-overview doc](/docs/platform-overview.md) for more information.

### Adding Controllers

Controllers are functions that will be executed when a route is matched after the app navigates to a different url. To add ***Monaco*** controllers use the `router` instance as an event listener to each route you defined:

    app.router.on( 'route:userProfile', function(userId) {
        var user = new app.models.User({id : userId});
        user.fetch();
        var profileView = new app.views.UserProfile({
            model : user
        });
        
        app.transitionTo(profileView);
    });


    app.router.on( 'route:userVideos', function(userId) {
        var videos = new app.collections.UserVideos(null, {userId: userId});
        videos.fetch();
        var videosView = new app.views.UserVideos({
            collection : videos        
        });
        
        app.transitionTo(videosView);
    });

The goal of a controller is to collect the necessary data, process it and create an object capable of presenting the data on the user screen. To understand more about **Monaco** controllers please check the [platform overview doc](/docs/platform-overview.md).

### Monaco Collections and Models

One of the things you should do on a controller is to collect the necessary data, this is done through the use of **Monaco.Model** and **Monaco.Collection**.

    app.add('Users', Monaco.Collection.extend({
        url : '/api/v1/users',
        cacheLocal : true,
        cacheExpire : 360 // 6 hours
    }));
        
    app.add('User', Monaco.Model.extend({
        url : function() {
            return this.collection.url + this.get('id');
        },
        collection : Users
    });

    app.add('UserVideos', Monaco.Collection.extend({
        initialize : function(models, options) {
            options = options || {};
            this.userId = options.userId;
        },

        url : function() {
            return '/api/v1/users/' + this.userId + '/videos';
        },
        cacheLocal: true,
        cacheExpire : 5 // 5 minutes
    }));

In this example we created a `Users` collection class and a `User` model class, setting the caching strategy and linking each other; we also created the `UserVideos` collection class linking it to a user (`userId`) every time an instance is created.

Based on their `url` property whenever you call the `fetch` method of a collection or model instance a request to the server will be made in order to obtain the necessary data. ***Monaco*** expects your server to be a RESTfull Api Server that returns JSON data. As in Backbone, if you server doesn't fully comply with the RESTfull paradigm then use the `parse` method from models and collections to sanitaze your data.

For more information about **Monaco.Collection** and **Monaco.Model** check the [platform overview doc](/docs/platform-overview.md). For more information about caching check [**monaco.local** doc](/docs/modules/monaco-local.md).


### Adding your Views

After processing the data the controller most often creates an instance of a view object **Monaco.View**, and then render the view to present the user with the data.

    app.add('UserProfile', Monaco.View.extend({
        template : Handlebars.templates['user.profile'],
        
        events : {
            'click #featured-videos-button' : 'showFeaturedVideos'
        }
        
        showFeaturedVideos : function(evt) {
            app.navigateTo('user:videos', this.model.get(id));
        }
    }));
    
    app.add('UserVideos', Monaco.View.extend({
        template : Handlebars.templates['user.profile'],
        
        events : {
            'click #back-button' : 'showProfile',
        },
        
        showProfile : function(evt) {
            app.navigateTo('user:profile', this.collections.userid);
        }
    }));

Views are javascript classes that controls the behaviour of ui elements presented to the users. In this example we create two views `UserProfile` and `UserVideos`; we link each view with a specific template object (in our example using handlebar templates); and also attached some events that will trigger specific functionality.

If you need more understanding on how to use **Monaco.View**, please check the [platform overview doc](/docs/platform-overview.md). For more information on screen transitioning check the [**monaco-transitions** doc](/docs/modules/monaco-transitions.md).

### Configuring your Application

When you have created all necessary assets and included the required business logic, then you are ready to configure how your application should behave by setting some application configuration states.

    app.set('language', 'en', true);
    app.set('username', window.username);

The code above uses the `set` method of the application object to store some values that can be later used by the application. For more information about how to configure your application visit the [**monaco-application.md** doc](/docs/modules/monaco-application.md).
    
### Starting your Application

Now that all is in place it is time to bootstrap your application. Use the `start` method of the application object passing any options necessary:

    app.start({pushState: true});

For more information on the options you can use when starting an application, check the [**monaco-application** doc](/docs/modules/monaco-application.md)

### Putting all together

Again the following code is presented all together, but a better and recommended approach would be to divide this code in multiple files to better organize your application. ***Monaco*** comes with a command line utility ([**monaco-cli**](/docs/monaco-cli.md)) that can help you organize your code in a better way.

    // creating the application object
    var app = new Monaco.Application('mobile');

    // adding routes
    app.router.add({
        'users/:id'                : ['userProfile', { regexp: {id: /\d+/} }],
        'users/:id/videos'         : ['userVideos',  { regexp: {id: /\d+/} }]
    });

    // adding necessary controllers
    app.router.on('route:userProfile', function(userId) {
        var user = new app.models.User({id : userId});
        user.fetch();
        var profileView = new app.views.UserProfile({
            model : user
        });
        
        app.transitionTo(profileView);
    });

    app.router.on('route:userVideos', function(userId) {
        var videos = new app.collections.UserVideos(null, {userId: userId});
        videos.fetch();
        var videosView = new app.views.UserVideos({
            collection : videos        
        });
        
        app.transitionTo(videosView);
    });

    // adding necessary collections and models
    app.add('Users', Monaco.Collection.extend({
        url : '/api/v1/users',
        cacheLocal : true,
        cacheExpire : 360 // 6 hours
    }));
        
    app.add('User', Monaco.Model.extend({
        url : function() {
            return this.collection.url + this.get('id');
        },
        collection : Users
    });

    app.add('UserVideos', Monaco.Collection.extend({
        initialize : function(models, options) {
            options = options || {};
            this.userId = options.userId;
        },

        url : function() {
            return '/api/v1/users/' + this.userId + '/videos';
        },
        cacheLocal: true,
        cacheExpire : 5 // 5 minutes
    }));

    // adding necessary views
    app.add('UserProfile', Monaco.View.extend({
        template : Handlebars.templates['user.profile'],
        
        events : {
            'click #featured-videos-button' : 'showFeaturedVideos'
        }
        
        showFeaturedVideos : function(evt) {
            var route = app.router.reverse('user:videos', {id: this.model.get(id)});
            app.router.navigate(route, {trigger: true});
        }
    }));
    
    app.add('UserVideos', Monaco.View.extend({
        template : Handlebars.templates['user.profile'],

        events : {
            'click #back-button' : 'showProfile',
        },

        showProfile : function(evt) {
            var route = app.router.reverse('user:profile', {id: this.collection.userId});
            app.router.navigate(route, {trigger: true});
        }
    }));
    

    // configuring your application
    app.set('language', 'en', true);
    app.set('username', window.username);

    // starting your application
    app.start({pushState: true});

