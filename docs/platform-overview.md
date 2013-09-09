platform-overview
====

Request/Response Cycle
----

On traditional web sites every time the user follows on a link, submits a form, or type another address direct on the browser, the browser sends a request to the server passing all the required information; the server then process the request collecting the necessary data and manipulating it; and then generates an html (most of the time) file and sends it back to the browser.

On modern web applications, the types you create with **Monaco** framework, the traditional request/response cycle doesn't apply.

The first difference is that on the first request the server responds with all the scripts necessary to run your entire application, this means that all the logic used to manipulate the data and generate the html are transfered to the client on the first request. This doesn't mean we don't need the server anymore, most applications will need to collect data from the server before manipulating it.

The first request of your application will follow the traditional request/response cycle, with the difference of bring to the client all the business logic of your application. After the first request you will use special navigation hooks to navigate between screens. This functionality allows you to change the url without making a round trip to the server.


As you can see when we navigate to a different url the front-end router matches the url and triggers a controller that will collect the necessary data (this might involve requesting it from a server); process the data and create views capable of presenting the data to the user.

There are a lot of pros and cons on both approaches (client apps vs server apps), please check this doc for a better understanding.


**Monaco.Application**
----

**Monaco.Application** allows you to create application objects that you can use throughout your code and that holds all elements you create on it. This is the core of the framework and most of the elements you will be working with has a reference to an instance of this class.

Please check the [**monaco.application** doc](/docs/modules/monaco-application.md) for more information.

**Monaco.Router**
----

Your router is where you list all the routes you expect your user to be navigating when using your application. **Monaco.Router** inherits from Backbone.Router and therefore has all the functionality from it. **monaco-router** expand its functionality with easier to include regex routes as well as reverse routing. Check [the docs](/docs/modules/monaco-router.md) for more info.

You can define your routes at different points in your application:

### Routes when creating your Application

	var app = new Monaco.Application('monaco', {
		routes: {
			'/users/:userid':			'userProfile',
			'/users/:userid/videos':	'userVideos'
		}
	});

If you prefer (or your application requires) that you define your routes before creating the application instance, and your don't have a lot of routes in your application, you might take advantage of this options of sending an object with your routes when instanciating your application object.

### Routes before Application Starts

	var app = new Monaco.Application('monaco');

	app.router.add({
		'/users/:userid':			'userProfile',
		'/users/:userid/videos':	'userVideos'
	});

	app.start();


This is the recommended way of defining routes, since it will give you the flexibility to define your routes in groups, at any point before you start your application, this way you can organize your code in whatever way your application requires. If you use **monaco-router** it will also give you the opportunity to work with regular expressions in a really easy way - check the [**monaco-router** doc](/docs/modules/monaco-router.md) for more info.

### Routes after Application starts

	var app = new Monaco.Application('monaco');

	app.start();

	app.router.route('/users/:userid', 'userProfile');

This method will allow you to add one router at a time, but this has the advantage of allowing you to add routes even after your application has been started. So use this options if your application requires that you create a dynamic custom route based on the use of the application by your users.


**Monaco Controller**
----

Controllers in **Monaco** most certanly don't follow the exaclty definition of an MVC paradign, but they serve the porpose of linking the code needed for your request to flow. Your controller will most certanly create the instances of your models and collections in order to fetch the necessary data, and also create an instance of a view capable of rendering the data in the screen. Controllers can be created inline when defining your routes, or can be directly appended as a method of the `router` instance, but the most flexible way is to listen to route events from your `router` instance. Check the [getting started doc](/docs/getting-started.md) for more info.

### Inline Controllers

    var app = new Monaco.Application('mobile');

    app.router.add({
    	'/users/:userid':	function(userId) {
    		console.log('profile user: ' + userId);
    	},

    	'/users/:userid/videos':	function(userId) {
    		console.log('videos for user: ' + userId);
    	}
    });

For really simplistic applications, with just a couple of routes, this option might be the prefered way, since you code will probably be easier to manage this way.

### Appending Controllers to `router` instance

	var app = new Monaco.Application('mobile');

	app.router.add({
		'/users/:userid':			'userProfile',
		'/users/:userid/videos':	'userVideos'
	});

	app.router.prototype.userProfile = function(userId) {
		console.log('profile user: ' + userId);
	};

	app.router.prototype.userVideos = function(userId) {
		console.log('videos for user: ' + userId);
	};

For more complex applications where you will have more than a couple routes and probably your routes and controllers will be split into multiple files to help organize your code. One caveat is that since you are attaching the method direct to the `router` instance you have to make sure you don't override an existing method of the `router` object, or even orverride another controller you have created yourself.

### Controllers as event listeners

	var app = new Monaco.Application('mobile');

	app.router.add({
		'/users/:userid':			'userProfile',
		'/users/:userid/videos':	'userVideos'
	});

	app.router.on('route:userProfile', function(userId) {
		console.log('profile user: ' + userId);
	});

	app.router.on('route:userVideos', function(userId) {
		console.log('videos for user: ' + userId);
	});

Still supper easy to implement and gives you the flexibility to organize the code the way you want in whatever file you need without incurring into the problem of overriding controller methods, and if you use **monaco-router** module, you can also take advantage of implementing filters - check the [**monaco-router** doc](/docs/modules/monaco-router.md) for more info.

**Monaco.Model**
----

A model is basically one related unit of data, if you compare with a table in a database, then the model would be one row of the table where you would get all the related attributes of one item. **Monaco.Model** inherits from *Backbone.Model* and therefore have all the functionality available in it. It also attach a default error method for failed fetch calls this default error method will trigger a 'fetch:error' event for the model that triggered the `fetch` call.

To create a model you will use the `extend` method from the **Monaco.Model** class, this way your model class will inherit all functionality from **Monaco.Model**, without duplicating code. Whenever you call a method from one instance of your model object if the method is defined on your model class then it will use it, if not then it will look on the Class from where your model class extended from and if found it will execute it there. This pattern allows you to create complex class structures in a simple way.

	app.add('User', Monaco.Model.extend({
		initialize: function(id) {
			this.id = id;
		},

		url: function() {
			return '/users/' + this.id;
		}

		friends: function() {
			// logic to return the user's friends
		}
	}));

	app.add('UserOfTheWeek', app.models.User.extend({
		url: function() {
			'/users/thisweek'
		}
	}));

On the code above we have created two models: `User` and `UserOfTheWeek`.

The `User` model class extends from **Monaco.Model** and therefore gets all the functionality available on it, but it also adds some functionality of its own, such as the `initialize`, `url` and `friends` methods. The `initialize` method is also available on ***Monaco*** (inherited from *Backbone*) but as a noop function, since the `User` model class has implemented it all instances of the `User` class will use your implementation.

The `UserOfTheWeek` model class extends from your custom `User` model class, and therefore it inherits all functionality from the `User` class. So even though you haven't created a `friends` method on the `UserOfTheWeek` model class this will be available to any instance of the class.

For a complete documentation on *Model* check the [*Backbone.Model* documentation]().

**Monaco.Collection**
----

A collection is a list of data units, if you compare it with a table in a database, then the collection would be the table where you would have a list of models. **Monaco.Collection** inherits from *Backbone.Collection* and therefore have all the functionality available in it. It also attach a default error method for failed fetch calls, this default error method will trigger a `fetch:error` event for the collection that triggered the `fetch` call.

To create a collection you will use the `extend` method from the **Monaco.Collection** class, this way your collection class will inherit all functionality from **Monaco.Collection**, without duplicating code. Whenever you call a method from one instance of your collection object if the method is defined on your collection class then it will use it, if not then it will look on the Class from where your collection class extended from and if found it will execute it there. This pattern allows you to create complex class structures in a really simple way.

	app.add('Videos', Monaco.Collection.extend({
		url: function() {
			return '/videos';
		},

		parse: function(resp, options) {
			return resp.videos;
		},

		short: function() {
			return this.filter(function(video) {
				return video.length <= 30;
			});
		}
	}));

	app.add('FeaturedVideos', app.collections.Videos.extend({
		url: function() {
			return '/videos/featured';
		}
	}));

On the code above we have created two collections: `Videos` and `FeaturedVideos`.

The `Video` collection class extends from **Monaco.Collection** and therefore gets all the functionality available on it, but it also adds some functionality of its own, such as the `url`, `parse` and `short` methods. The `parse` method is also available on ***Monaco*** (inherited from *Backbone*), since the `Videos` collection class has implemented it all instances of the `Videos` class will use your implementation.

The `FeaturedVideos` collection class extends from your custom `Videos` collection class, and therefore it inherits all functionality from the `Videos` class. So even though you haven't created a `short` method on the `FeaturedVideos` collection class this will be available to any instance of the class.

For a complete documentation on *Collection* check the [*Backbone.Collection* documentation]().

**Local Caching**
----

Defining your local caching strategy can be chalenging, specially if you don't have the necessary tools. **monaco-local** provides the necessary hooks so you can define the caching strategy for your data. You will be able to define three levels of caching: App Level (disabling or enabling caching for all collections of your app); Collection Definition (controls the specific collection you are defining); Fetch Call (enable or disable caching per fetch call).

In adition to enabling and disabling caching you can also set the expiration for the data you are caching. All properties you use to define the caching (`resource`, `cacheLocal` and `cacheExpire`) can be assigned to a function what makes this configuration really flexible. Check [the docs](/docs/modules/monaco-local.md) for more info.

**Moanco.View**
----

Views are classes that you can use to controll the behaviour of your ui elements. **Monaco.View** inherits from Backbone.View and therefore has all the functionality available in it. **monaco-view** extends this functionality by providing an easier way of managing subviews inside of a *master view*. A master view is just a view with one or more subviews.

By default whenever you instantiated **master view** all of its subviews will also be instanciated; and when you render a *master view* all of its subviews will also be rendered; and all subviews will be automatically removed just before removing their *master view*. Check the [**monaco-views** doc](/docs/modules/monaco-view.md) for more info.

**Monaco.Transition**
----

**Monaco.Analitics**
----

**Monaco.Experiments**
----

**Monaco.Multirequests**
----
