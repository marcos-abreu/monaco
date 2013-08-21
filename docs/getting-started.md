Getting Started
====

The ***Monaco*** framework is based on **Backbonejs**, and therefore it has all of the features available in Backbonejs and more.

***Monaco*** follows the same concepts of **Backbonejs**, where you create routes that when matched by the current url will trigger a function responsible for collection data, processing it and instanciating an object that can present the data on the user screen.

The main concepts of Backbonejs are *Router*, *Model*, *Collection*, *View*, and *Event*. Monaco extend each one of those elements adding its own functionality them, and also expose new ones, such as: *Application*, *Transition*, *Local*. Please check the [overview docs for more details](/docs/plataform-overview.md).

Loading your assets
----

The first thing you need in order to run your application is to load the necessary scripts in an html page:

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

**Monaco**'s requirements are [**Backbonejs**](), and backbone's only hard requirement [**underscorejs**](). But you can use the [**lodash**]() instead of **underscorejs**, in my tests it performs better.

Backbone doesn't have a hard dependency on a DOM library, but it does depend on a library capable of doing XHR requests if the app requires external data. Currently it lists [**jQuery**]() and [**Zepto**]() as supported DOM libraries you can use. If your application needs a DOM library then include the request for it before the framework dependencies.

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

Creating a ***Monaco*** application is really easy, basically you will need is to instanciate the `Monaco.Application` class:

    var app = new Monaco.Application('mobile');

For all the options you can use when creating an application please check the [**monaco-app* docs](/docs/monaco-app.md).

### Adding Routes

When adding routes to an application we can use the `addRoutes` method of the application object, if your route starts with a `^` character then it will be treated as a regex router, otherwise it will be treated as a simple router.

    // adding routes
    app.addRoutes({
        '^users\\/(\\d+)\\/?$'                : ['userProfile',       'user:profile'],
        '^users\\/(\\d+)\\/videos\\/?$'       : ['userVideos',        'user:videos']
    });

To know more about **Monaco.Router** please check the [overview docs](/docs/platform-overview.md); for regex routes please check the [**monaco.router** module docs](/docs/monaco-router.md).


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

To understand more about **Monaco** controllers please check [overview doc](/docs/platform-overview.md).


### Monaco Collections and Models

Whenever you need to fetch and manipulate data, you will need to create models and collections:

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

To understand more about how to use *Monaco.Model* and *Monaco.Collection* please check [overview doc](/docs/patform-overview.md)

### Adding your Views

Views are javascript classes that controls the behaviour of the screen presented to the users:

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
    
If you need more understanding on how to use views works, please check the [overview doc](/docs/platform-overview.md).

### Congiguring your Application

When you have all assets of your application, then you are ready to configure it before starting the application.

    // configuring your application
    app.set('language', 'en', true);
    app.set('username', window.username);

The code above uses the `set` method of the application object to store some values that can be latter used by the application. For more information about how to configure your application visit the [overview doc](/docs/platform-overview)
    
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



