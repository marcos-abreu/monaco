monaco-local
====

One important aspect of modern web applications is your caching strategy. You need to make sure the information needed is available as fast as possible and that the application doesn't make more than the strictly necessary requests to the server, saving bandwidth, increasing application speed, and saving battery for mobile applications.

**monaco-local** provides a local caching system (using the browsers’ localStorage) that can be used when setting your caching strategy. The caching system works by storing fetched collection data behind the scenes whenever calling `collection.fetch` method. (for `model.fetch` read the **Caching Models** bellow)

Using **monaco-local** you can use three levels of caching for your application collections: global; collection definition; collection fetch calls.

Caching Properties
----

When defining the caching architecture of your application you will be using the following properties:

**resource** : *string* : string that uniquely identifies a collection  
**cacheLocal** : *boolean* : flag indicating if caching should be enabled or disabled (`false` by default )  
**cacheExpire** : *integer* : integer number indicating how many minutes is the data valid after being cached (30 minutes by default)  

By properly using these properties you can define which resource should be cached and for how long. When using **monaco-local** the `resource` property becomes a required property of all collections.

Instead of passing the appropriate value type for each of the properties above you can assign a function that will return the expected value type - check the **Advanced Caching** section below.

Global Caching
----

When **monaco-local** is added to your application, you can define a global caching strategy by passing `cacheLocal` and the `cacheExpire` properties when creating your application object: (by default global caching is disabled)

sample:

    var app = new Monaco.Application('mobile', {
        cacheLocal : true,
        cacheExpire : 10
    });

    app.add('Users', Monaco.Collection.extend({
        resource : 'users',
        url : 'http://www.sample.com/api/v2/users'
    }));
    
    app.start();

    var users = new app.collections.Users();
    users.fetch();

The code above created a sample application `app` indicating that any collection data of this app should cached for 10 minutes, it then added a `Users` collection to the application, started the application; created an instance of the `Users` collection and fetched its data from the server.

The caching mechanism will work behind the scenes to (based on the configuration provided) store the fetched data locally so that subsequent fetch requests to the same collection (within the timeframe set up with the `cacheExpire` property) don't hit the server, but instead get the data that is available locally.

By setting up a global caching strategy every collection by default will cache fetched data using the configuration provided, but you can override this behaviour in the other two levels of caching (collection definition and collection fetch calls).


Collection Definition Caching
----

You can also define how a specific collection should behave when fetching its data by providing the `cacheLocal` and `cacheExpire` properties when defining a collection, this value will override the global caching properties.

sample:

    var app = new Monaco.Application('mobile', {
        cacheLocal : true,
        cacheExpire : 10
    });

    app.add('Users', Monaco.Collection.extend({
        resource : 'users',
        url : 'http://www.sample.com/api/v2/users',
        cacheLocal : false
    }));
    
    app.add('Friends', Monaco.Collection.extend({
        resource : 'friends',
        url : 'http://www.sample.com/api/v2/friends',
        cacheLocal : true,
        cacheExpire : 30
    }));
    
    app.start();

    var users = new app.collections.Users();
    users.fetch();
    
    var friends = new app.collections.Friends();
    friends.fetch();


The code above created a sample Monaco application `app` with global cache enabled and set to 10 minutes, it then added a `Users` collection with cache set to false, created a `Friends` collection with cache set to true and expiration to 30 minutes after the data is first retrieved. It then started the application, created an instance of the `Users` collection, fetched its data, created an instance of the `Friends` collection and also fetched its data.

Even though globally we have defined that all collection data would be cached locally by 10 minutes after being fetched from the server, we overrode caching settings for the `Users` collection indicating that we don't want to cache any data fetched for this collection, this means that every time `fetch` is called for this collection the system will make a new request to the server to get the necessary data.

For the `Friends` collection, we overrode the global caching settings indicating that we will indeed cache fetched data from this collection, but for a longer time (30 minutes) then what is set on global configuration (10 minutes)


Fetch Call Caching
----

When performing a `fetch` call from a collection you can override both global caching settings and collection definition caching settings, allowing you to have a really refined control when and for how long to cache your data.

sample:

    var app = new Monaco.Application('mobile', {
        cacheLocal : true,
        cacheExpire : 10
    });

    app.add('Users', Monaco.Collection.extend({
        resource : 'users',
        url : 'http://www.sample.com/api/v2/users',
        cacheLocal : false
    }));
    
    app.add('Friends', Monaco.Collection.extend({
        resource : 'friends',
        url : 'http://www.sample.com/api/v2/friends',
        cacheLocal : true,
        cacheExpire : 30
    }));
    
    app.start();

    var users = new app.collections.Users();
    users.fetch({
        cacheLocal : true,
        cacheExpire : 5
    });
    
    var friends = new app.collections.Friends();
    friends.fetch({
        cacheLocal : false;
    });

The example above is almost the same as the previous example, the only difference is that when we call the `fetch` method of the `users` and `friends` collection instances we are again modifying the caching configuration, overriding the global and collection definition settings.

For the `users` collection instance we have defined that globally it would be cached for 10 minutes, then on the collection definition we overrode this by defining that the `User` collection wouldn't be cached, but again this is overridden in the `fetch` call where we set cache for 5 minutes.

For the `friends` collection instance we have defined that globally it would be cached for 10 minutes, then on the collection definition we overrode the expiration to be 30 minutes from the first fetched data, and then for that specific `fetch` call we indicated that the data shouldn't be cached.

Bypassing Caching
----

After the fetched data gets stored locally any subsequent `fetch` calls to that specific collection will use (if not expired) the local data instead of firing another XHR request.

You can bypass this by setting the `fresh` property to `true` when performing a `fetch` call.

sample:

    var app = new Monaco.Application('mobile');
    app.add('Users', Monaco.Collection.extend({
        resource : 'users',
        url : 'http://www.sample.com/api/v2/users',
        cacheLocal : true,
        cacheExpire : 10
    }));

    app.start();

    var users = new app.collections.Users();
    users.fetch();
    
    ...
    
    users.fetch({
        fresh : true
    });

On the code above we have created a sample Monaco application `app`, added a `Users` collection definition with cache set to 10 minutes, started the application, created a users collection instance and then fetched the data twice.

The first `fetch` call will cache the response for 10 minutes; so lets say that the second `fetch` call was done before the original data is expired, if we haven't included the `fresh` property it would use the local data, but because we used this property the `fetch` call will bypass the local stored data and will make another request to the server.

The data returned by the second `fetch` call will replace the data stored by the first. If you want that call to bypass the local stored data without overriding the data stored by the first call you could:

    ...
    users.fetch({
        ...
        fresh : true,
        cacheLocal : false
    });


Forcing Cached Data only
----

In some cases you might want to work with local data only, basically not hiting the server whenever a feching collection data, in this case you can use the `localOnly` property. This property can be set per collection definition or per `fetch` call, whichever is more appropriate for your logic.


    ...
    users.fetch({
        ...
        localOnly : true
    });


Caching individual Models
----

Caching collections will probably be the most common (if not the only) type of caching you will need in your application, but in some cases you need to cache data from a `model.fetch` call. If you have this need then you should associate your model with a collection (where you will set the caching properties)

    app.add('Users', Monaco.Collection.extend({
        resource : 'users',
        cacheLocal : true,
        cacheExpire : 720 // 12 hours
    }));

    app.add('User', Monaco.Model.extend({
        collection : app.collections.Users,
        ...
    }));

Now when calling the `fetch` method of the model (even if you haven't called the `collection.fetch` method at all), the caching system will first try to retrieve it from the collection data, and then if not available or expired it will try to fetch from the server, caching the returned data using the information available on the model's collection.

You can get a little more fancy and set the `cacheExpire` property in the Model definition (or the `model.fetch` call) so that your model has its own caching expiration. The way it works is that the expiration of the collection will be checked first and if the data is considered good then the expiration set on the model will be checked.


Advanced Caching Configuration
----

As mentioned earlier the `resource`, `cacheLocal` and `cacheExpire` can be assigned to functions that will return the expected value type for each property. This allows you to create really advanced caching strategies.

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

In the example below we will define the expiration time based if the user is fetching his own user videos or someone else video list.

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

**monaco-local** automatically clean up expired data, and replace it with fresh data; but from time to time you might want to clean up some cached data, this is an often task when developing your application, but it might also be used on the code you ship to your users.

**app.local.clear(resource)**

where:

**resource** : *string* : optional collection resource string

If the `resource` name is passed to this function then just that resource will be removed from the local cache, but if you don't pass anything to the method, then all resources will be removed from the local caching.

sample:

    app.local.clear('users');


Prefetching Data
----

Another way of using **monaco-local** to cache the data needed is to prefetch some data when you request the page that will start your application:

    var app = new Monaco.Application({
        prefetched : {
            users : { expire: 50, data: [{"id": 1, "first_name": "john"}, {"id":2, "first_name": "maria"}] },
            videos : { data: [{"id": 1, "title": "Homade Project"}, {"id": 2, "title": "Super Cool Video"}] }
        }
    });

The `prefetched` property should be defined as an object where each key correspond to a collection `resource` property and its value is a literal object with a required `data` property that is a list of models, basically the same object structure you would expect if you were doing a fetch call from the collection instance; and an optional `expire` property indicating how many minutes is the data valid for after being cached (if you don't provide the `expire` property then the app global expire or ***Monaco***'s default expire will be applied).



