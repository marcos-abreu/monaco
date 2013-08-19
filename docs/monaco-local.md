monaco-local
====

One important aspect of modern web applications is your caching strategy. You need to make sure the information needed is available as fast as possible and that the app doesn't need to make more than the strictly necessary requests to the server, saving bandwith, increasing application speed, and saving battery for mobile applications.

**monaco-local** provides a local caching system (using the browsers localStorage) that can be used when setting your caching strategy. The caching system works by storing fetched collection data behind the scenes whenever calling `collection.fetch` method.

You can use three levels of caching for your application collections using **monaco-local**: global; collection definition; collection fetch.

Caching Properties
----

When defining the caching archtecture of your application you will be setting the following properties, in multiple places depending on the levels of caching you need to use.

**resource** : *string* : string that uniquely identify the collection  
**cacheLocal** : *boolean* : flag indicating if caching should be enabled or disabled (`false` by default )  
**cacheExpire** : *integer* : integer number indicating how many minutes is the data valid after being cached (30 minutes by default)  

By using the combination above we can identify which resource should be cached and for how long. When using **monaco-local** the `resource` property becomes a required property of all collections you create.

Instead of passing the appropriate value type for each of the properties above you can assign a function that will return the expected value type and create really advanced caching - check the **Advanced Caching** section bellow for more info and samples.

Setting Global Caching
----

When **monaco-local** is added to your application, you can define a global caching strategy by passing `cacheLocal` and the `cacheExpire` properties: (by default global caching is disabled)

sample:

    var myApp = new Monaco.Application('mobile', {
        cacheLocal : true,
        cacheExpire : 10
    });

    myApp.add('Users', Monaco.Collection.extend({
        resource : 'users',
        url : 'http://www.sample.com/api/v2/users'
    }));
    
    myApp.start();

    var users = new myApp.collections.Users();
    users.fetch();

The code above created a sample application `myApp` indicating that any collection of this app should cache data for 10 minutes, then added a `Users` collection to it, started the application; created an instance of the `Users` collection and fetched its data from the server.

The caching mechanism will work behind the scenes to (based on the configuration provided) store the fetched data locally so that subsequent fetch requests to the same collection (within the timeframe set up with the `cacheExpire` property) don't hit the server, but instead get the data that is available locally.

By setting up a global caching strategy every collection by default will be cache fetched data using the configuration provided, but you can override this behaviour in the other two levels of caching (collection definition and collection fetch calls).


Setting Caching on Collection Definition
----

You can also define how a specific collection should behave when fetching its data, but providing the `cacheLocal` and `cacheExpire` properties when defining a collection, this value will override the global caching properties.

sample:

    var myApp = new Monaco.Application('mobile', {
        cacheLocal : true,
        cacheExpire : 10
    });

    myApp.add('Users', Monaco.Collection.extend({
        resource : 'users',
        url : 'http://www.sample.com/api/v2/users',
        cacheLocal : false
    }));
    
    myApp.add('Friends', Monaco.Collection.extend({
        resource : 'friends',
        url : 'http://www.sample.com/api/v2/friends',
        cacheLocal : true,
        cacheExpire : 30
    }));
    
    myApp.start();

    var users = new myApp.collections.Users();
    users.fetch();
    
    var friends = new myApp.collections.Friends();
    friends.fetch();


The code above created a sample Monaco application `myApp` with global cache enabled and set to 10 minutes, it then added a `Users` collection with cache set to false, created a `Friends` collection with cache set to true and expiration to 30 minutes after the data is first retrieved. It then started the application, created an instance of the `Users` collection, fetched its data, created an instance of the `Friends` collection and also fetched its data.

Even though globally whe have defined that all collection data would be cached locally by 10 minutes after being fetched from the server, we overrode caching settins for the `Users` collection indicating that we don't want to cache any data fetched for this collection, this means that every time you use the `fetch` method for this collection the system will make a new request to the server to get the necessary data.

For the `Friends` collection, we overrode the global caching settings indicating that we will indeed cache fetched data from this collection, but for a longer time (30 minutes) then the global configuration (10 minutes)


Setting Caching per Fetch call
----

When performing a `fetch` from a collection you can override both global caching settings and collection definition caching settings, allowing you to have a really refined control when and for how long to cache your data.

sample:

    var myApp = new Monaco.Application('mobile', {
        cacheLocal : true,
        cacheExpire : 10
    });

    myApp.add('Users', Monaco.Collection.extend({
        resource : 'users',
        url : 'http://www.sample.com/api/v2/users',
        cacheLocal : false
    }));
    
    myApp.add('Friends', Monaco.Collection.extend({
        resource : 'friends',
        url : 'http://www.sample.com/api/v2/friends',
        cacheLocal : true,
        cacheExpire : 30
    }));
    
    myApp.start();

    var users = new myApp.collections.Users();
    users.fetch({
        cacheLocal : true,
        cacheExpire : 5
    });
    
    var friends = new myApp.collections.Friends();
    friends.fetch({
        cacheLocal : false;
    });

The example above is almost the same as the previous example shown, the only difference is that when we call the `fetch` method of the `users` and `friends` collection instances we are again modifing the caching configuration, overriding the global and collection definition settings.

For the `users` collection instance we have defined that globally it would be cached for 10 minutes, then on the collection definition we overrorde this setting defining that the `User` collection woudn't be cached, but again overriding this setting for that specific `fetch` call caching the retrieved data for 5 minutes.

For the `friends` collection instance we have defined that globally it would be cached for 10 minutes, then on the collection definition we overrode the expiration to be 30 minutes from the first fetched data, and then for that specific `fetch` call we indicated that the data shouldn't be cached.

Bypassing Caching
----

After the fetched data gets stored localy any subsequent `fetch` calls to that specific collection will use (if not expired) the local data instead of firing another XHR request.

You can bypass this by sending the `fresh` property to `true` when performing a `fetch` call.

sample:

    var myApp = new Monaco.Application('mobile');
    myApp.add('Users', Monaco.Collection.extend({
        resource : 'users',
        url : 'http://www.sample.com/api/v2/users',
        cacheLocal : true,
        cacheExpire : 10
    }));

    myApp.start();

    var users = new myApp.collections.Users();
    users.fetch();
    
    ...
    
    users.fetch({
        fresh : true
    });

On the code above we have created a sample Monaco application, added a `Users` collection definition with cache set to 10 minutes, started the application, created a users collection instance and then fetched the data twice.

The first `fetch` call will cache the response for 10 minutes; so lets say that the sencond `fetch` call was done before the original data is expired, if we haven't included the `fresh` property it would use the local data, but because we used this property the `fetch` call will bypass the local stored data and will make another request to the server.

The data returned by the second `fetch` call will replace the data stored by the first. If you want that call to bypass the local stored data without overriding the data stored by the first call you could:

    ...
    users.fetch({
        fresh : true,
        cacheLocal : false
    });


Forcing Cached Data only
----

In some cases you might want the `fetch` calls to use only the local stored data, and never send a server request even if the data is not available. In this cases you can use the `localOnly` property

    ...
    users.fetch({
        localOnly : true
    });


Caching individual Models
----

Caching collections will probably be the most common (if not the only) type of caching you will need in your application, but in some cases you need to cache data from a `model.fetch` call. If you have this need then you should:

1. Associate your model with a collection ( where you will set the caching )

    myApp.add('Users', Monaco.Collection.extend({
        resource : 'users',
        cacheLocal : true,
        cacheExpire : 720 // 12 hours
    }));

    myApp.add('User', Monaco.Model.extend({
        collection : myApp.collections.Users,
        ...
    }));

Now when calling the `fetch` method of the model (even if you haven't called the `collection.fetch` method at all), the caching system will first try to retrieve it from the collection data, and then if not available or expired it will try to fetch from the server, caching the returned data using the information available on the model's collection.

You can get a little more fancy and set the `cacheExpire` property in the Model definition (or the `model.fetch` call) so that your model has its own caching expiration. The way it works is that the expiration of the collection will be checked first and if the data is considered good the expiration set on the model will then be checked.


Advanced Cahing Configuration
----

As mentioned earlier the `resource`, `cacheLocal` and `expireCache` can be assigned to functions that will return the expected value type for each property. This allows you to create really advanced caching strategies.

For example lets say that you want to cache a list of featured videos per language:

    var app = new Monaco.Application('VideoStore');
    app.set('language', 'en');
    
    app.add('Videos', Monaco.Collection.extend({
        resource : function() {
            return 'videos.' + this.app.get('language');
        },
        
        cacheLocal : true,
        cacheExpire : 10
    }));

    app.start();
    
    var videos = new app.collections.Videos();
    videos.fetch();


In this example above we have defined the `resource` property as a function that returns a `string` based on the current language. This way the user when switching languages on your application won't see the same list of featured videos, but instead each list will be cached accounting for the language chosen.

----

In the example bellow we will define the expiration time based if the user is fetching his own user videos or someone else video list.

    var app = new Monaco.Application('Contacts');
    app.add('UserVideos', Monaco.Collection.extend({
        resource : 'user-videos',
        
        initialize: function(models, options) {
            options = options || {};
            this.username = options.username;
        },
        
        cacheLocal : true,

        cacheExpire : function() {
            if(this.username === app.get('username')) {
                return 2;
            }
            return 10;
        }
    }));

    app.start();
    
    var videos = new app.collections.UserVideos();
    videos.fetch();


For your own video list the collection is cached for 2 minutes, but everyone else lists will be cached for 10 minutes.


Clean up cached data
----

From time to time you might want to clean up some cached data, this is a really ofter task when developing your application, but it might also be used on the code you ship to your users.

**app.local.clear(resource)**

where:

**resource** : *string* : optional collection resource string

If resource is passed to this function then just that resource will be removed from the local cache, but if you don't pass anything to the method, then all resources will be removed from the local caching.

sample:

    app.local.clear('users');


Prefetching Data
----

Another way of using **monaco-local** to cache the data needed is to prefetch some data when you request the page that will start your application:

    var app = new Monaco.Application({
        prefetched : {
            users : [{"id": 1, "first_name": "john"}, {"id":2, "first_name": "maria"}],
            videos : [{"id": 1, "title": "Homade Project"}, {"id": 2, "title": "Super Cool Video"}]
        }
    });

The `prefetched` property should be defined as an object where each key correspond to a collection `resource` property and its value is a list of models, basically the same object structure you would expect if you were doing a fetch call from the collection instance.

The expiration for the prefetched data will be set following the configuration available on either the collection definition or for the global settings.

