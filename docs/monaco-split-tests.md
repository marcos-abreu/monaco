monaco-split-tests
====

The premise behind split testing is to try different ideas, with the goal of increasing visitor's interest and effectiveness of your application. **monaco-split-tests** provides the necessary tools to test all your ideas and measure the result of the tests.

**monaco-split-tests** was build based on google analytics custom variables and events and therefore requires you to have an account with google analytics (currently using the stable tracking code `ga.js`).

Todo: verify if I can make this analytics agnostic | and verify if I can port this to the new analytics.js and allow the developer to override this if necessary the same way the **monaco-analytics** have done.

Configuring your Tests
----

The first step is to configure your test, on the configuration stage of your application you should add the test configuration:

sample:

    var app = new Monaco.Application('mobile');

    // adds a new monaco split test
    app.addTest('featured-videos', {
        cookie : { prefix: ‘ab’, days : ‘360’, baseDomain : false },
        ga : { scope : 2 }
    }); // the options shown here are the default options

    // set the split test variations
    app.tests['featured-videos'].set({
        'variation1' : {suffix : 'RL_V1'},
        'variation2' : {suffix : 'RL_V2'},
        'variation3' : {suffix : 'RL_V3'}
    }, 0.20);

    // split - returning which variation this session is assigned to
    app.tests['featured-videos'].split();

The code above creates a new sample application `app`; adds a new test called `featured-videos`; sets the test variations indicating a key (value to be send to google analytics) and a suffix (value to be used inside of your app) for each variation - it also set the percentage of users that will participate on this test `0.20` (20%); and finally it split the test to set which variation the current user will be included (if any).

The next time the user loads up your application the configuration will be read the same way (updating any information you add/remove/change from it) but if the user was already set to a variation of the test (verified through the cookie) he will stay on the same variation.

To check the current variation for the current user you can call

    app.tests['featured-videos'].current;

This should either return one of the variations key, or the string `_original` indicating that the user is not part of the test.

Redirecting to different Controllers
----

If you are testing ideas that will require access to different data, and different business logic applied to this data then you should use this option and redirect the call, for the users selected to a specific test variation, to a different controller.

To do that create separate controllers that has the naming ending with the suffix assigned to each variation, and use the `controller` method from your test object to set the right controller to respond to your route.

sample:

    var app = new Monaco.Application('mobile');

    app.addTest('profile-friends');
    
    app.tests['profile-friends'].set({
        'variation1' : { sufix : 'AB_V1' },
        'variation2' : { sufix : 'AB_V2' }
    });
    
    app.split();

    app.addRoutes({
        '^users\\/(\\d+)\\/?$'           : [app.tests[‘profile-friends’].controller('userProfile'),  'user:profile'],
        '^users\\/(\\d+)\\/videos\\/?$'  : ['userVideos',                                            'user:videos']
    });
    
    app.addController('userProfile', function(userId) {
        // original implementation of the controller
        ...
    });
    
    app.addController('userProfile_AB_V1', function(userId) {
        // variation1 for the user-access-button split test
    });
    
    app.addController('userProfile_AB_V2', function(userId) {
        // variation2 for the user-access-button split test
    });

    app.start();

Redirecting to different View
----
If you are testing ideas that will require access to the same data, but visually it will look different and/or will have different ways of the user interacting with the screen then you should use this option where users selected to a specific variation will be redirected to different view objects.

To do that create separate views that has the naming ending with the suffix assigned to the specific variation, then use the `view` method from your test object to set the right view on your controller.

sample:

    var app = new Monaco.Application('mobile');

    app.addTest('profile-friends');
    
    app.tests['profile-friends'].set({
        'variation1' : { sufix : 'AB_V1' },
        'variation2' : { sufix : 'AB_V2' }
    });
    
    app.split();

    app.addRoutes({
        '^users\\/(\\d+)\\/?$'                : [‘userProfile’,   'user:profile'],
        '^users\\/(\\d+)\\/videos\\/?$'       : ['userVideos',  'user:videos']
    });
    
    app.addController('userProfile', function(userId) {
        var profile = new app.models.UserProfile();
	  profile.fetch();
	  var profileView = new app.views[app.test['profile-mobile'].view('UserProfile')]({
            model : profile
        });
        app.transitionTo(profileView);
    });

    app.add('UserProfile', Monaco.View.extend({
        // original profile view
    });

    app.add('UserProfile_AB_V1', Monaco.View.extend({
        // variation 1
    });

    app.add('UserProfile_AB_V2', Monaco.View.extend({
        // variation 2
    });
    
    app.start();

---
Instead of creating completely new views for your variation test you can also use an existing view as base of your new view.

sample:

    app.add('UserProfile', Monaco.View.extend({
        // original profile view
    });

    app.add('UserProfile_AB_V1', app.views.UserProfile({
        // variation 1
    });

    app.add('UserProfile_AB_V2', app.views.UserProfile_AB_V1({
        // variation 2
    });

Noticed that on the code above I have used the original `UserProfile` view as base for my first variation and that I have used the view from my first variation as base of my second variation - this is a common practices that might help you reduce the amount of code on your split tests.

Redirecting to different Templates
----

If you are testing ideas that will require access to different ways of presenting the same data with the same business logic and the same screen behaviour then you should use this option where users selected to a specific variation will be redirected to different template files.

To do that create separate template files that has the naming ending with the suffix assigned to the specific variation, then use the `template` method from your test object to set the right template in your view.

* *The examples below uses handlebars syntax, but you can use your template engine of choice:*

----

original template ('user.profile.handlebars'):

    <div id="user-profile">
        <img src="{{ user.avatar }}" alt="{{ user.name }}"/>
        <p>{{ user.name }}</p>
        <a href="/users/{{ user.id }}">Show Profile</a>
    </div>

----
variation 1 for the user profile screen test ('user.profile.screenv1.handlebars')

    <div id="user-profile" class="card">
        <a href="/users/{{ user.id }}">
            <img src="{{ user.avatar }}" alt="{{ user.name}}" />
        </a>
        <div class="meta-info">
            <h2>{{ user.name }}</h2>
            <p>{{ user.status }}</p>
        </div>
        
        <a href="/users/{{ user.id }}">Show Profile</a>
    </div>
----
variation 2 for the user profile screen test ('user.profile.screenv2.handlebars')

    <div id="user-profile">
        <h2><a href="/users/{{ user.id }}">{{ user.name }}</a></h2>
        <p>{{ user.status }}</p>
        <a href="/users/{{ user.id }}">Show Profile</a>
    </div>

----
application

    var app = new Monaco.Application('mobile');

    app.addTest('user-screen');
    
    app.tests['user-screen'].set({
        'variation1' : { sufix : 'screenv1' },
        'variation2' : { sufix : 'screenv2' }
    });
    
    app.split();

    app.addRoutes({
        '^users\\/(\\d+)\\/?$'                : ['userProfile',       'user:profile'],
        '^users\\/(\\d+)\\/videos\\/?$'       : ['userVideos',        'user:videos']
    });
    
    app.addController('userProfile', function(userId) {
        var model = new app.models.UserProfile();
        model.fetch();
        var userProfile = new app.views.UserProfile();
    });

    app.add('UserProfile', Monaco.View.extend({
        template : Handlebars.templates[this.app.tests['user-screen'].template('user.profile')],
        ...
    }));

    app.start();


Presenting different Template elements
----

If you are testing ideas that will have slightly different changes on template elements then you should use this option and execute a simple `if` in your template where you can decided which variation to show using the `current` property of the test object.

sample:

    app.tests['user-access-button'].current

The possible values of the `current` property are: the keys set for each variation of the test, as well as the string `_original` (set to users left out of the test:

    if (app.tests['user-access-button'].current === 'variation1') {
        <a href="/users/{{ user.id }}" class="small-button">Show Profile</a>
    }
    else if (app.tests['user-access-button'].current === 'variation2') {
        <a href="/users/{{ user.id }}" class="small-button">Show Profile</a>
    }
    else {
        <a href="/users/{{ user.id }}">Show Profile</a>
    }

Measuring Results
----

When the `split` method is called a google analytics custom variable is created following the configuration provided, routes, views and templates will fire the normal events as you have configured and you should be able to filter the reports on google analytics based on the custom variable value set.


Cleaning up after Testing
----

One of the points developer seems to forget sometimes is that we should clear the extra code included for the split tests. Check the type of implementation you performed on the documentation above and reverse your changes leaving just the side of the test that has proven to perform better than the others.
