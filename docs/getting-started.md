Getting Started
====

The **Monaco** framework is based on **Backbonejs**, and therefore it has all of the features available in Backbonejs and more.

Monaco follows the same concepts of Backbone, where you create routes that when matched by the current url will execute a function that will grab the necessary data, manipulate this data if necessary and then renders it to the user in the screen.

When working with **Monaco** you will be using the following objects

**Monaco.Application**
This is the core and only required module of **Monaco**. It creates an application object and manages all elements that are added to it. Please check **monaco-app** docs for more details.

**Monaco.Router**
This object extends from `Backbone.Router`. Please check the **Monaco.Router** docs for more detail. You might also need more advanced functionality, if so have a look into **monaco-router**.

**Monaco.Model** and **Monaco.Collections**
These classes extends from `Backbone.Model` and `Backbone.Collection` respectively. Please check the **Monaco.Model** docs for more detail.

**Monaco.View**
This class extends from `Backbone.View`. Please have a look into **monaco-views** for subviews management if you need that in your application.

**Monaco.Transition**
This object depends on the **monaco-transitions** and will help you manage ui transitions. Please have a look into the docs for more info.

----
You will also be working with a couple of function helpers like:

**`addRoutes`**
This application method adds a collection of routes to the application router

**`addController`**
This application method adds a new controller to the application router


Knowing how to work with these objects and methods are key to learn how to build an application using **Monaco**.


Loading your assets
----

The first thing you need to run your application is to load the necessary scripts in an html page:

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

**Monaco** requires backbone and any of backbones's dependencies. Officially backobne requires **underscorejs**, but you can use the **lodash** instead, in my tests it performs better.

Backbone doesn't have a hard dependency on a DOM library, but it does depend on a library capable of doing XHR requests if your app will make use of external data. Currently it lists jQuery and Zepto as supported DOM libraries you can use. If your application needs a DOM library then include the request for it before the framework dependencies.

After listing the script dependencies for the framework we include the request for the `your-app.js` this should be the file that have all the code for your application. In more complex applications this file will be divided into multiple files to help you organize your code. Please check the monaco-cli docs for an introduction in how you can organize your application code.


Application workflow
----

A common workflow for front-end application is:

- create the application object
- add routes, controllers, models, collections and views (and their template files)
- configuring your application
- starting your application

What follows is an explanation of each step of this workflow, this should help you understand how to build a simple application. The complete code will be presented by the end.


Let's break each of these parts and explain each one in detail

### Create a Monaco Application

Creating a **Monaco** application is really easy, basically you will need a command like this:

    var app = new Monaco.Application('mobile');

For all the options you can use when creating an application please check the **monaco-app* docs.

### Adding Routes

When adding routes to an application we can use the `addRoutes` method of the application object, if your route starts with a `^` character then it will be treated as a regext, otherwise it will be treated as a simple router.

    // adding routes
    app.addRoutes({
        '^users\\/(\\d+)\\/?$'                : ['userProfile',       'user:profile'],
        '^users\\/(\\d+)\\/videos\\/?$'       : ['userVideos',        'user:videos']
    });

To know more about **Monaco.Router** please the the folloing docs; for regex routes please check the **monaco.router** module docs.


### Adding Controllers

Controllers are just functions that will be executed when the first matched route if found after navigating to a different url. To add **Monaco** controllers you can use the `addController` method of your application object:

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

To understand more about **Monaco** controllers please check this doc.


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

To understand more about how to use *Monaco.Model* and *Monaco.Collection* please check this docs.

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
    
If you need more understanding on how to use views please check thi this doc

### Congiguring your Application

Configuration is an important part of your appliation and the

    // configuring your application
    app.set('language', 'en', true);
    app.set('username', window.username);
    
### Starting your Application

    // starting your application
    app.start({pushState: true});

### Putting all together

Again the following code is presented all together, but a better and recommended approach would be to divide this code in multiple files to better organize your application. **Monaco** comes with a command line utility (**monaco-cli**) that can help you organize your code in a better way.

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



