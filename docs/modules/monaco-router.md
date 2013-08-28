monaco-router
====

RegEx Routes
----

**monaco-router** extends the original **Monaco.Router** functionality and expose a simple way of defining complex routes using regular expressions

    var app = new Monaco.Application();
    
    app.addRoutes({
        'users/:userid'                       : ['userProfile',  {regexp: {userid: /\d+/}],
        'users/:userid/videos/:videoid'       : ['userVideos',   {regexp: {userid: /\d+/, videoid: /\d+/}]
    });


By adding **monaco-router** you can now use the same **Monaco.Router** `addRoutes` method to define regex constraints for your route by defining the `regexp` object in the second element of the route array value. The first element of the array value will still be the name of the controller associated with the route. The second element might have also other properties aside from the regexp object, see **reverse routing** bellow.

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

    /* ------ Defining which filters will be applied to which controllers ------- */
    app.applyFilters(['isAuthenticated'], ['userProfile', 'userVideos']);
    app.applyFilters(['cleanupFriends'], ['userVideos']);


    /* ------ Filter function definition ---------------------------------------- */
    // sample of a before filter
    app.addFilter('isAuthenticated', function(func, args) {
        // logic to check if the user is authenticated, if it so return 
        // a value trutful value, otherwise a falsy value

        // call the next function inline ( this might be another filter or the original controller)
        return func.apply(this, args);
    });

    // sample of an after filter
    app.addFilter('clearCachedVideos', function(func, args) {
        // execute all next functions (other filters not yet executed and then the original controller)
        result = func.apply(this, args);

        // dont execute the filter code if any other function returned `false`
        if (result === false) {
            return result;
        }

        // logic to clear cached Videos

        return true;
    });

The code above have created a sample application (`app`) and then added two routes to the application; it then defined a filter `isAuthenticated` that should wrap the controllers: `userProfile` and `userVideos`; then another filter that wrapped just the `userVideos`; after that it defined both the `isAuthenticated` and `clearCAchedVideos` filters.

This means that before the `userProfile` and `userVideos` controller gets called the `isAuthenticated` filter will be called. The filter will receive as its first parameter a reference to the original function that this filter is wrapping, and as a second paramemter an array of original arguments used to call the controller.

The `userVideos` controller gets wrapped twice, first with the `isAuthenticated`, then with the `clearCachedVideos`. You can execute code before or after you call the wrapped function. Whenever you are ready to call the original function being wrapped then just use the line: `func.apply(this, args)` where `args` is the second argument for the filter function.

If you want to abord and not execute the next function inline to be executed on your logic don't call the `func.apply(this, args);`


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
