Getting Started
====

The ***Monaco*** framework is based on **Backbonejs**, and therefore it has all of the features available in Backbonejs and more.

***Monaco*** follows the same concepts of **Backbonejs**, where you create routes that when matched by the current url will trigger a function responsible for collecting data, processing it and instantiating an object that can present the data on the user screen.

The main concepts of Backbonejs are *Router*, *Model*, *Collection*, *View*, and *Event*. ***Monaco*** extend each one of those elements adding its own functionality to them, and also expose new ones, such as: *Application*, *Transition*, *Local*. Please check the [platform overview](/docs/plataform-overview.md) docs for more details.

Loading your assets
----

The first thing you need in order to run your application is to load the necessary scripts in an html page (you will need a server capable of serving html files and necessary assets):

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

***Monaco***'s requirements are [**Backbonejs**](http://backbonejs.org/), and backbone's only hard requirement [**underscorejs**](http://underscorejs.org/). But you can use the [**lodash**](http://lodash.com/) instead of [**underscorejs**](http://underscorejs.org/), in my tests it performs better.

Backbone doesn't have a hard dependency on a DOM library, but it does depend on a library capable of doing XHR requests if the app requires external data. Currently it lists [**jQuery**](http://jquery.com/) and [**zepto**](http://zeptojs.com/) as supported DOM libraries you can use. If your application needs a DOM library then include the request for it before the requests for the framework and its dependencies.

The last script on the example above is your application script, in our example called `your-app.js`, where you will include all the logic of your application. Your application will probably be divided into multiple files, but you should use a deployment process capable of combining and minifying them into one file in order to minimize the number of requests.


Application workflow
----

A common workflow for front-end application is:

- create the application object
- add routes, controllers, models, collections, views (including their template files) and transitions
- configuring your application
- starting your application

What follows is an explanation of each step of this workflow, this should help you understand how to build a simple application.

### Create a ***Monaco*** Application

Creating a ***Monaco*** application is really easy, basically you will need is to instantiate the `Monaco.Application` class:

    var app = new Monaco.Application('mobile');

For all the options you can use when creating an application please check the [**monaco-app* docs](/docs/monaco-app.md).

### Adding Routes

When adding routes to an application we can use the `addRoutes` method of the application object. In the following example we are using regex routes from the [**monaco-router**](/docs/monaco-router.md) module, if you don’t need advanced routes, then check the docs on the [platform-overview](/docs/platform-overview.md).

    // adding routes
    app.addRoutes({
        '^users\\/(\\d+)\\/?$'                : ['userProfile',       'user:profile'],
        '^users\\/(\\d+)\\/videos\\/?$'       : ['userVideos',        'user:videos']
    });

What the cove above does is to try to match the url when you navigate (using the `navigate` method of the application router instance) and for the first matched route it will call the appropriate method (controller - see below). In the example above the method is listed as the first array element assigned to the route.

### Adding Controllers

Controllers are functions that will be executed when a route is matched after navigating to a different url. To add ***Monaco*** controllers you can use the `addController` method of your application object:

    // adding necessary controllers
    app.addController('userProfile', function(userId) {
        var user = new app.models.User({id : userId});
        user.fetch();
        var profileView = new app.views.UserProfile({
            model : user
        });
        
        app.transitionTo(profileView);
    });
    
    app.addController('userVideos', function(userId) {
        var videos = new app.collections.UserVideos(null, {userId: userId});
        videos.fetch();
        var videosView = new app.views.UserVideos({
            collection : videos        
        });
        
        app.transitionTo(videosView);
    }));

The goal of a controller is to collect the necessary data, process it and create an object capable of presenting the data on the user screen. To understand more about **Monaco** controllers please check the [platform overview](/docs/platform-overview.md) doc.

### Monaco Collections and Models

You saw that on the controllers we need to collect the data, this is done through the use of **Monaco.Model** and **Monaco.Collection**.

    // adding necessary collections and models
    app.add('Users', Monaco.Collection.extend({
        cacheLocal : true,
        cacheExpire : 360 // 6 hours
    }));
        
    app.add('User', Monaco.Model.extend({
        collection : Users
    });

    app.add('UserVideos', Monaco.Collection.extend({
        initialize : function(models, options) {
            options = options || {};
            this.userId = options.userId;
        },

        cacheLocal: true,
        cacheExpire : 5 // 5 minutes
    }));

In this example we created a `Users` collection class and a `User` model, we set the caching strategy and link each other; we also created the `UserVideos` collection linking it to a userid every time an instance is created.

For more information about **Monaco.Collection** and **Monaco.Model** check the [platform overview](/docs/platform-overview.md) doc. For more information about caching check [**monaco.local**](/docs/monaco-local.md).


### Adding your Views

After processing the data the controller most often creates an instance of a view object (**Monaco.View**), and then transition to the view to present the user with the data.

    // adding necessary views
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

Views are javascript classes that controls the behaviour of the screen presented to the users. In this example we create two views `UserProfile` and `UserVideos`; we link each view with a specific template object; and also attached some events that will trigger specific functions of the view.

If you need more understanding on how to use **Monaco.View**, please check the [platform overview](/docs/platform-overview.md) doc.

### Configuring your Application

When you have created all necessary assets and included the required business logic, then you are ready to configure how your application should behave by setting some application configuration states.

    // configuring your application
    app.set('language', 'en', true);
    app.set('username', window.username);

The code above uses the `set` method of the application object to store some values that can be later used by the application. For more information about how to configure your application visit the [overview doc](/docs/platform-overview)
    
### Starting your Application

Now that all is in place it is time to bootstrap your application. Use the `start` method of the application object passing any options necessary:

    // starting your application
    app.start({pushState: true});

For more information on the options you can use when starting an application, check the [**monaco-app** doc](/docs/monaco-app.md)

### Putting all together

Again the following code is presented all together, but a better and recommended approach would be to divide this code in multiple files to better organize your application. **Monaco** comes with a command line utility ([**monaco-cli**](/docs/monaco-cli.md)) that can help you organize your code in a better way.

    // creating the application object
    var app = new Monaco.Application('mobile');

    // adding routes
    app.addRoutes({
        '^users\\/(\\d+)\\/?$'                : ['userProfile',       'user:profile'],
        '^users\\/(\\d+)\\/videos\\/?$'       : ['userVideos',        'user:videos']
    });

    // adding necessary controllers
    app.addController('userProfile', function(userId) {
        var user = new app.models.User({id : userId});
        user.fetch();
        var profileView = new app.views.UserProfile({
            model : user
        });
        
        app.transitionTo(profileView);
    });
    
    app.addController('userVideos', function(userId) {
        var videos = new app.collections.UserVideos(null, {userId: userId});
        videos.fetch();
        var videosView = new app.views.UserVideos({
            collection : videos        
        });
        
        app.transitionTo(videosView);
    }));

    // adding necessary collections and models
    app.add('Users', Monaco.Collection.extend({
        cacheLocal : true,
        cacheExpire : 360 // 6 hours
    }));
        
    app.add('User', Monaco.Model.extend({
        collection : Users
    });

    app.add('UserVideos', Monaco.Collection.extend({
        initialize : function(models, options) {
            options = options || {};
            this.userId = options.userId;
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
    

    // configuring your application
    app.set('language', 'en', true);
    app.set('username', window.username);

    // starting your application
    app.start({pushState: true});




