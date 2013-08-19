monaco-app
====

This is the core module of Monaco, and the only required module of the framework. This module allows you to keep your application code integrated.

Creating New Application
----

To create a new application using Monaco you just need to instantiate a new `Monaco.Application` object.

    var myApp = new Monaco.Application('mobile');

***Monaco.Application(appName, options)***

where:

**appName** : *string* : unique identifier for your application  
**options** : *object* : optional javascript object with options for your application

Your application object will have the following properties:

`myApp.name` - the name of the application  
`myApp.options` - options that passed when creating the application instance  
`myApp.models` -  namespace that will be used to include the models you add to your application  
`myApp.collections` - namespace that will be used to include the collections you add to your application  
`myApp.views` - namespace that will be used to include the views you add to your application  

Your application object is also extended from Backbone Events and therefore can be used as a global pub/sub event system, for example:

    var myApp = new Monaco.Application('mobile');
    myApp.on('start', function() {
        console.log('application started');
    };

or

    myApp.trigger('user:loggedin', {user: user});


Adding Objects to your Application
----

This module also provides a way of adding models, collections, views (and if you have included the **monaco-transition** module you can also use it to add transitions) to your application

***add(name, object)***

where:

**name** : *string* : javascript valid variable name to be used as a class name for your object  
**object** : *object* : monaco javascript object(models, collections, views, transitions*) to be added to your application  

sample:

    var myApp = new Monaco('my-application');

    myApp.add('Users', Monaco.Collection.extend({
        initialize : function() {
            ...
        }
    }));


To access an object that was added to monaco using the `add` method you can use its appropriate namespace:

    var users = new myApp.collections.Users();


Some of the advantages of using the `add` method instead of accessing the prototype of the application namespace and injecting the object direct in there are:

- Objects get automatically added to a defined namespace for each object type (Views: myApp.views | Models: myApp.models | Collections: myApp.collections | *Transitions: myApp.transitions)

- Every object gets set a reference to the application when they are instantiated

    var users = new myApp.collections.Users();
    console.log( myApp === users.app );

- Avoids namespace objects from being overridden by mistake


App Configuration
----

Every application needs to set some configuration, for example: active locale, date format, etc. Monaco accomplishes that by providing an application level `get` and `set` methods:

***set(key, value, cache)***

where:

**key** : *string* : key used to later retrieve the information stored  
**value** : *mixed* : any javascript value you want to store for later use  
**cache** : *boolean* : optional flag indicating if you want this information to be stored in local storage  

sample:

    var myApp = new Monaco('my-application');
    myApp.set('language', 'en');


***get(key)***

where: 

**key** : *string* : key used to retrieve the information stored

sample:

    myApp.get('language');

----

The `set` and `get` methods can also be used to transfer information between parts of your application, for example let's say that most of your screens makes use of the username, you could set the username using the `set` method and retrieve it whenever you need in your application.



Application Initialization
----

After having created your application, added all routes, controllers, models, collections, views, and have properly configured your application you can start your application using the `start` method.

***start(options)***

where:

**options** : *object* : javascript object 

Different modules might provide additional `options` that can be passed when initializing your application, but by default the only option that will be taken into consideration by the `start` method is:

**pushState** : *boolean* : flag indicating if you want to use the pushstate in your application (false by default)

sample:

    var myApp = new Monaco.Application(‘mobile’);
    myApp.set(‘username’, ‘marcos’);
    myApp.start({pushState: true});

