monaco-experiments
====

The premise behind experiments (split tests) is to try different ideas with the goal of increasing visitor's interest and effectiveness of your application. **monaco-experiments** provides the necessary tools to test all your ideas.

By default **monaco-experiments** uses Google Analytics to store the data of your experiments, making it useful out of the box to a lot of applications, but if you want ot use another service or your own api to store the data of each experiment check the **Custom Configuration** section bellow.

Configuring your Experiments
----

The first step when creating an experiment is to configure it.

    var app = new Monaco.Application('mobile');

    // Set an experiment with its group variations
    app.experiments.set('featured-videos', {
        'variation1' : {suffix: 'FV_V1'},
        'variation2' : {suffix: 'FV_V2'},
        'variation3' : {suffix: 'FV_V3'}
    }, { users : 0.20 });

    // randomaize the groups and assign the user to a current group for this experiment
    app.experiments.get('featured-videos').split();

The code above creates a new sample application `app`; adds a new experiment called `featured-videos` with its variations object; it also set the percentage of users that will participate on this experiment `0.20` (20%); and finally it split the experiment to set which variation the current user will be included (if any).

The next time the user loads up your application the configuration will be read the same way, but if the user was already set to a variation of the experiment (verified through the cookie) he will stay on the same variation.

After running your experiment for some time, you could technically modify the group variations or the percentage of users that would participate in the experiment, but I strongly advise against it, since this might (in most cases) invalidate your experiment; usually, in this case, you would close the experiment (see **Cleaning up After** bellow) and create a new one.

To check the current variation for the current user call:

    app.experiments.get('featured-videos').current;

This will either return one of the variations key, or the string `__original__` indicating that the user is not part of the experiment.

Redirecting to different Controllers
----

If you are experimenting ideas that will require access to different data, and/or different business logic applied to this data then you should use this option and redirect the call, for the users selected to a specific experiment variation, to a different controller.

To do that create separate controllers that has the naming ending with the suffix assigned to each variation, and use the `controller` method from your experiment object to set the right controller to respond to your route.

    var app = new Monaco.Application('mobile');

    app.experiments.set('profile-friends', {
        'variation1' : {suffix : 'AB_V1'},
        'variation2' : {suffix : 'AB_V2'}
    }, {users: 0.10});

    app.experiments.get('profile-friends').split();

    app.addRoutes({
        'users/:id'                     : [app.experiments.get('profile-friends').controller('userProfile'), 'user:profile'],
        'users/:id/videos'              : ['usersVideos', 'user:videos']
    });
    
    app.addController('userProfile', function(userId) {
        // original implementation of the controller
        ...
    });
    
    app.addController('userProfileAB_V1', function(userId) {
        // variation1 for the profile-friends experiment
    });
    
    app.addController('userProfileAB_V2', function(userId) {
        // variation2 for the profile-friends experiment
    });

    app.start();

Redirecting to different Views
----
If you are experimenting ideas that will require access to the same data, but visually it will look different and/or will have different ways of the user interacting with the screen then you should use this option where users selected to a specific variation will be redirected to different view objects.

To do that create separate views that has the naming ending with the suffix assigned to each specific variation, then use the `view` method from your experiment object to set the right view on your controller.

    var app = new Monaco.Application('mobile');

    app.experiments.set('profile-friends', {
        'variation1' : {suffix : 'AB_V1'},
        'variation2' : {suffix : 'AB_V2'}
    }, {users: 0.10});

    app.experiments.get('profile-friends').split();

    app.addRoutes({
        'users/:id'                     : ['userProfile', 'user:profile'],
        'users/:id/videos'              : ['usersVideos', 'user:videos']
    });
    
    app.addController('userProfile', function(userId) {
        var profile = new app.models.UserProfile();
        profile.fetch();
        var profileView = new app.views[app.experiments.get('profile-mobile').view('UserProfile')]({
            model : profile
        });
        app.transitionTo(profileView);
    });

    app.add('UserProfile', Monaco.View.extend({
        // original profile view
    });

    app.add('UserProfileAB_V1', Monaco.View.extend({
        // variation 1
    });

    app.add('UserProfileAB_V2', Monaco.View.extend({
        // variation 2
    });
    
    app.start();

---
Instead of creating completely new views for your variation experiment you can also use an existing view as base of your new view.

    app.add('UserProfile', Monaco.View.extend({
        // original profile view
    });

    app.add('UserProfile_AB_V1', app.views.UserProfile({
        // variation 1
    });

    app.add('UserProfile_AB_V2', app.views.UserProfile_AB_V1({
        // variation 2
    });

Noticed that on the code above I have used the original `UserProfile` view as base for my first variation and that I have used the view from my first variation as base of my second variation - this is a common practices that might help you reduce the amount of code on your experiments with different views.

Redirecting to different Templates
----

If you are experimenting ideas that will require different ways of presenting the same data with the same business logic and the same screen behaviour then you should use this option where users selected to a specific variation will be redirected to different template files.

To do that create separate template files that has the naming ending with the suffix assigned to each specific variation, then use the `template` method from your experiment object to set the right template in your view.

* *The examples below uses *Handlebars* templates, but you can use your template engine of choice:*

----

original template ('user.profile.handlebars'):

    <div id="user-profile">
        <img src="{{ user.avatar }}" alt="{{ user.name }}"/>
        <p>{{ user.name }}</p>
        <a href="/users/{{ user.id }}">Show Profile</a>
    </div>

----
variation 1 for the user profile screen experiment ('user.profile.screenv1.handlebars')

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
variation 2 for the user profile screen experiment ('user.profile.screenv2.handlebars')

    <div id="user-profile">
        <h2><a href="/users/{{ user.id }}">{{ user.name }}</a></h2>
        <p>{{ user.status }}</p>
        <a href="/users/{{ user.id }}">Show Profile</a>
    </div>

----
application

    var app = new Monaco.Application('mobile');

    app.experiments.set('user-screen', {
        'variation1' : { suffix : 'screenv1' },
        'variation2' : { suffix : 'screenv2' }
    }, {users: 0.3});
    
    app.experiments.get('user-screen').split();

    app.addRoutes({
        'users/:id'                     : ['userProfile', 'user:profile'],
        'users/:id/videos'              : ['usersVideos', 'user:videos']
    });
    
    app.addController('userProfile', function(userId) {
        var model = new app.models.UserProfile();
        model.fetch();
        var userProfile = new app.views.UserProfile();
    });

    app.add('UserProfile', Monaco.View.extend({
        template : Handlebars.templates[app.experiments.get('user-screen').template('user.profile')],
        ...
    }));

    app.start();


Presenting different Template elements
----

If you are experimenting ideas that will have slightly different changes on template elements then you should use this option and execute a simple `if` in your template where you can decided which variation to show using the `current` property of the experiment object.

    app.experiments.get('user-access-button').current

The possible values of the `current` property are: the key set for one of the experiment variations, or the string `__original__` (set to users left out of the experiment):


    if (app.experiments.get('user-access-button').current === 'variation1') {
        <a href="/users/{{ user.id }}" class="small-button">Show Profile</a>
    }
    else if (app.experiments.get('user-access-button').current === 'variation2') {
        <a href="/users/{{ user.id }}" class="small-button">Show Profile</a>
    }
    else {
        <a href="/users/{{ user.id }}">Show Profile</a>
    }

Custom Configuration
----

Sometimes you will need to change the default configuration of **monaco-experiments** to better integrate the framwork with your application. You can configure the necessary properties for google analytics; the cookie api; or even change the service that stores the experiment data.

### Configuring Google Analytics

The default implementation uses Google Analytics Custom Variables to set the current variation for the User. GA uses a `slot` and `scope` values when setting Custom Variables, but default Monaco sets these values to `1` and `2` respectively, but you can changed that:

    var app = new Monaco.Application('mobile', {
        experiments: {
            ga : { slot: 2, scope: 1 }
        }
    });

### Configuring Cookie Api

**monaco-experiments** uses ***Monaco* Cookies** to set and get cookies needed to retain the user in one variation of the experiment on future visits to the application. When setting the cookie **monaco-experiments** will set the following by default: cookie prefix = `ab-`; cookie expiration = 360 days; use base domain = false. You can change these:

    var app = new Monaco.Application('mobile', {
        experiments: {
            cookie : {prefix: 'test-', days=180, baseDomain: ''}
        }
    });

### Replacing the Cookie API

If you need to use a different cookie api based on your requirements, you can integrated it with **monaco-experiments** and not use the ***Monaco* Cookies** Utilities:

In this example I'm assuming your cookie api has the following methods with the signatures: `myCookiePlugin.set(cookieName, cookieValue)` and `myCookiePlugin.get(cookieName)`:

    Monaco.Experiments.prototype.cookie.get = function(key) {
        window.myCookiePlugin.get(key);
    };

    Monaco.Experiments.prototype.cookie.set = function(key, value, days, baseDomain) {
        window.myCookiePlugin.set(key, value);
    };

    var app = new Monaco.Application('mobile');

You can see that we have replaced ***Monaco***'s `get` and `set` methods with our own implementation, and our implementation calls the custom plugin cookie respective methods. Also notice that we did that before creating our application object that will instanciate **Monaco.Experiments* automatically.

### Storing data using custom Service

If your application requires you to use another service to store the data from your experiments, or you have an api that you want to use to store the experiment data in house, then you will have to override the method that is used to save this data when we split the experiment `saveGroup`. The following is the default implementation of this method:

    Monaco.Experiment.prototype.saveGroup = function(groupKey) {
        this._gaq.push(['_setCustomVar', this.options.ga.slot, this.key, groupKey, this.options.ga.scope]);
        this._gaq.push(['_trackEvent', 'experiments', 'join', (this.key + '|' + groupKey)]);
    };

If you need to use a different service or your own, you need to override this method with your own implementation:

    Monaco.Experiment.prototype.saveGroup = function(groupKey) {
        // your logic here
        // you have access to:
        //        `groupKey` - the variation key this user is set to, or the string `__original__`
        //        `this.options` - options sent when the application object was created
        //        `this.key` - the experiment key
    };

    var app = new Monaco.Application('mobile');

Measuring Results
----

If you are using the default implementation that uses Google Analytics Custom Variables, you can use your GA account to verify the results of your experiments. 

Everytime the split is called and the user is not part of any variation (or `__original__`) yet, the `saveGroup` method will be called, setting a custom variable with the test key and the variation value. Also a custom event will be sent detailing that someone has joined the experimet.

This configuration allows you to check the number of users in each variation; but also any event sent to GA after that will carry the same custom variable and therefore you can filter your reports and identify what actions users of a specific experiment variation did and compare with other variations of the same experiment.

If you have implemented your own services to store the experiment data, than you should use the tools available in your service to evaluate the data collected from the experiment.

Cleaning up After
----

One of the points developer seems to forget sometimes is that he should clear the extra code included for the experiments.

1. The first thing you should do is to reverse the changes you did based on the type of implementation chosen (refer to the topics above to know how the experiment can be implemented), leaving just the variation that has proven to perform better among all variations of your experiment.

2. Remove the experiment configuration added, where you set the experiment and all its variations and the amount of users participating in the experiment.


Opting Out
----

Sometimes you may allow your users to opt out from a specific experiment, if you need to do this please call the `optout` method from the experiment instance when that user is using the app.

    var app = new Monaco.Application('mobile');

    app.experiments.set('profile-friends', {
        'variation1' : {suffix : 'AB_V1'},
        'variation2' : {suffix : 'AB_V2'}
    }, {users: 0.10});

    app.experiments.get('profile-friends').split();

    app.addRoutes({
        'users/:id'                      : ['userProfile', { regex: {id: /\d+/ } }]
        'users/:id/:experiment/opt-out'  : ['experimentOptout', { regex: { id: /\d+/, experiment: /[\w\-]+/ } }]
    });

    app.addController('userProfile', function(userId) {
        // original controller
    });

    app.addController('userProfileAB_V1', function(userId) {
        // variation 1
    });

    app.addController('userProfileAB_V2', function(userId) {
        // variation 2
    });

    app.addController('experimentOptout', function(userId, experiment) {
        if ( app.get('userid') === '12345' ) {
            app.experiments.get('profile-friends').optout();
        }
        ....
    });
    
    app.start();


Notice that in the `experimentOptout` controller we have included a condition where if the `userId` is set to `12345` then the code will opt out the current user from the `profile-friends` experiment. Notice also that we have created a url that will trigger this logic, but you don't need to implement your logic this way you can implement it as part of your configuration; view logic; or basically anywhere after the experiment has been configured. 

Be careful with the use of this feature, cause even though the experiment will initially have registered the user as part of a specific variation (or not) after opting out any events or pageview traking for that user won't reflect the variation he was initially assigned to, but instead will account towards the original implementation. Depending on the experiment you are running and the amount of users that have opted out, it might invalidate your experiment.




