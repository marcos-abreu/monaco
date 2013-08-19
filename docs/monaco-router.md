monaco-router
====

RegEx Routes
----

Monaco Router extends the original router functionality and expose a simple way of defining complex routes using regular expressions

    var app = new Monaco.Application();
    
    app.addRoutes({
        '^users\\/(\\d+)\\/?$'                : ['userProfile',       'user:profile'],
        '^users\\/videos\\/?$'                : ['userVideos',        'user:videos']
    });


The `addRoutes` method expect an object where each key is a regular expression string that the url will be matched against; each value for the keys is an array of two elements, the first element is a string with the controller name that will be executed if the current app url matches the regular expression key; and the second element of the array is the name of the url.

Notice that the regular expression is using double backslashing, this is how we set strings with regex patterns in javascript.


Filters
----

An important feature of Monaco routes is the ability of filtering the request by executing somecode before or after the controller gets called.

This is important if you need to do some preprocessing or post processing. For example lets say that you need to make sure the user is authenticated before executing the controller:

    var app = new Monaco.Application();

    app.addRoutes({
        '^users\\/(\\d+)\\/?$'                : ['userProfile',       'user:profile'],
        '^users\\/videos\\/?$'                : ['userVideos',        'user:videos']
    });

    app.addFilter('before', 'isAuthenticated', function() {
        // logic to check if the user is authenticated
        // if it is you should return the boolean true
        // if not you should return false
    });

    app.addFilter('after', 'clearCachedVideos', function() {
        // code to clear cached Videos
    });

    app.applyFilters(['isAuthenticated'], ['userProfile', 'userVideos']);
    
    app.applyFilters(['cleanupFriends'], ['userVideos']);


The code above will execute the `isAuthenticated` before calling the `userProfile` or the `userVideos` controllers and if the filter returns true the controller will normally execute, but if it returns false the call will be canceled.

The `clearCachedVideos` filter will be executed after the `userVideos` controller finishes. In this case return either true or false won't chage the flow of the application since the controller was already executed.


Reverse Routing
----

Sometimes when working on your code you want to make the application navigate to one of the routes you have defined, for example using the routes from the previous sample code lets say that when the user is viewing the user profile page we want to have a button that will first verify if you are friends with this person and if so navigate to the list of videos from this user:

    var app = new Monaco.Application();

    app.addRoutes({
        '^users\\/(\\d+)\\/?$'                         : ['userProfile',       'user:profile'],
        '^users\\/(\\d+)\\/videos\\/?$'                : ['userVideos',        'user:videos']
    });


    app.add('UserProfile', Monaco.Views.extend({
        events : {
            'click #user-videos-btn' : 'showVideos'
        },
        
        showVideos : function(evt) {
            // logic to verify if the user is friends with the profile shown // if not just return false to this method
            
            this.app.navigate('user:videos', [ this.model.id ]);
        }
    });

The methos showVideos will verify if the user is friends with the profile shown and if it is will use the `navigate` method to go to a different url

**navigate(urlName, parameters)**

where:

**urlName** : *string* : url name to be searched on the routes added to the application
**parameters** : *array* : array of parameters expected by the url

The advantage of using the `app.navigate` method instead of setting the `window.location.href` property is that if your url changes, but your parameters list are the same you won't need to touch the code that uses the url.

