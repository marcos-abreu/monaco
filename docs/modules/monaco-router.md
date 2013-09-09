monaco-router
====

RegEx Routes
----

**monaco-router** extends the original **Monaco.Router** functionality and expose a simple way of defining complex routes using regular expressions

    var app = new Monaco.Application();
    
    app.router.add({
        'users/:userid'                       : ['userProfile',  {regexp: {userid: /\d+/}],
        'users/:userid/videos/:videoid'       : ['userVideos',   {regexp: {userid: /\d+/, videoid: /\d+/}]
    });


By adding **monaco-router** module you can now use the same **Monaco.Router** `add` method to define regex constraints for your route by defining the `regexp` object in the second element of the route array value. The first element of the array value will still be the name of the controller associated with the route. The second element might have also other properties aside from the regexp object, see **reverse routing** bellow.

Now when navigating to other routes, the router will take into consideration the regexp constraints you have defined, allowing you to build more specific url patterns.

Filters
----

**monaco-router** also add the ability of filtering the request by executing code before or after the controller associated with the specific route gets called.

This is important if you need to do some preprocessing or post processing. (e.g: say you need to make sure the user is authenticated before executing a specific controller)

    var app = new Monaco.Application();

    app.addRoutes({
        'users/:userid'                       : ['userProfile',  {regexp: {userid : /\d+/}],
        'users/:userid/videos'                : ['userVideos',   {regexp: {userid : /\d+/}]
    });


    /* ------ Defining filters -------------------------------------------------- */

    // sample of a before filter
    app.router.addFilter('isAuthenticated', function(func, args) {
        // logic to check if the user is authenticated, if it so return 
        // a value trutful value, otherwise a falsy value

        // call the next function inline ( this might be another filter or the original controller)
        return func.apply(this, args);
    });


    // sample of an after filter
    app.router.addFilter('clearCachedVideos', function(func, args) {
        // execute all next functions (other filters not yet executed and then the original controller)
        result = func.apply(this, args);

        // dont execute the filter code if any other function returned `false`
        if (result === false) {
            return result;
        }

        // logic to clear cached Videos

        return true;
    });

    /* ------ Applying Filters to Controllers ----------------------------------- */

    app.router.add('userProfile', app.router.filter(['isAuthenticated'], function() {
        // Controller Code
    }));

    app.router.add('userVideos', app.router.filter(['isAuthenticated', 'clearCachedVideos'], function() {
        // Controller Code
    }));


The code above have created a sample application (`app`) and then added two routes to the application; it then defined the filter `isAuthenticated` and the filter `clearCachedVideos`; finally it applied the `isAutheticated` to the `userProfile` controller; and the `isAuthenticated` and the `clearCachedVideos` to the `userVideos` controller.

This means that before the `userProfile` and `userVideos` controllers gets called the application will call the filter(s) in the same order they are listed in the `filter` method, each filter will define when to call the next function. If the filter don't call the next function and just ends, then script execution will stop and the controller will never be called.

Each filters receive two parameters, the first parameter is a reference to the next function to be called, and the second parameter is an array with the original parameters expected by the controller. If the filter is the last filter in the list then the first parameter will be a reference to the controller function to be called.


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
            
            var route = app.router.reverse('user:videos', {userid: this.model.get('id')});
            app.router.navigate(route);
        }
    });

The method `showVideos` will verify if the user is friends with the profile shown and if it is will use the `navigate` method to go to a different route. The `route` variable was created by calling the `reverse` method of the app router, with any necessary parameters in order to reverse the route into a valid url.
