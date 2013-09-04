monaco-multirequest
====

**monaco-multirequest** allows you to execute multiple async fetch requests and manage callbacks (success and error) after all of them are done.

The main concept of **monaco-multirequest** is that either all requests will succeed triggering a unified `success` callback or if one fails, then all remaining requests will be aborted and the request error will be passed to the multirequest `error` callback.

Multi Fetch Requests
----

**monaco-multirequest** creates an application level method `multiFech` you can use to fetch multiple objects at once:

	var app = new Monaco.Application('mobile');

	app.add('Users', Monaco.Collection.extend({
		// Users collection definition
	}));

	app.add('Videos', Monaco.Collection.extend({
		// Videos collection definition
	}));

	app.add('Profile', Monaco.Model.extend({
		// User Profile Model definition
	}));

	app.router.add({
		'/users/:userid' : 'showProfile'
	});

	app.router.on( 'route:showProfile', function(userId) {
		var profile = new app.models.Profile(userId),
			friends = new app.collections.Users(userId),
			videos = new app.collections.Videos(userId);

		app.multiFetch([profile, friends, videos], {
			success : function(resps) {

			},

			error : function(obj, resp, options) {

			}
		});
	});


In the code above we created a sample application; then we defined two collections and one model; added one route that when matched with the current url will trigger a controller. The controller will create one instance of a user profile model, one instance of friends users collection and one instance of a videos collection; then a multi fetch request will be made (`multiFetch`), passing as the first parameter an array of either models or collections - in this example the three objects we instanciated; and an options object - in the example this options object have two items: one `success` function and one `error` function.

In a simplistic explanation - internally **monaco-multifetch** will call the `fetch` method for each object and after all of them returns, then the `success` or `error` callback will be executed depending on the status of the fetch results.

Any options properties, other than the `success` and the `error` callbacks, you define on the options argument will be passed to each object `fetch` call.

Success Callback
----

The success callback will receive a literal object containing each `fetch` call response, from the list objects (models or collections). The keys of this literal object will match each object `cid` property. In the example shwon in the *Multi Fetch Requests* section to access the response for the `videos` instance on the success callback of the `multiFetch` call:

    ...
	app.multiFetch([profile, friends, videos], {
		success : function(resps) {
			videoResponse = resps[videos.cid];
		},
		...
	});
    ...

The response object from each fetch call will have:

- `object`  - the original collection or model object  
- `resp`    - the XHR response object  
- `options` - the options object use on the request

* *originally `Monaco.Collection` classes don't have a `cid` property, but **monaco-multifetch** extends it to include a client id (`cid`).*

Error Callback
----

Whenever **monaco-multifetch** gets an error response from a `fetch` call then it will imediately abort any pending requests and execute the `error` callback passing along the original error parameters. In this case the `success` callback won't be executed even if some objects have already been completed with success.

The parameters you will receive are the original parameters from the `fetch` error:

- `object`  - the original collection or model object  
- `resp`    - the XHR response object  
- `options` - the options object use on the request

