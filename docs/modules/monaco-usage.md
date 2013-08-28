Creating an Application
-----------------------

creating an application with Monaco is as easy as doing:

    var app = new Monaco.Application();

when creating an application you can pass an object with a couple of parameters you want to attach to your application, such as prefetched data (`prefetched`), or .... for a full list of the predefined options please check the Monaco API.


Initializing your Application
-----------------------------

After creating your application you can initialize it by calling:

    app.start();

You can pass an object when calling the `start` method to better customize how you want your application to be initialized, for 
example you can:

	app.start({ pushState : true });

The previous command would start your application with pushState routes (for more info about pushState please visit: TODO)


Defining Routes
---------------

Just creating an application and starting it won't do much if you don't define the routes of your application, this basically let you define what should happen when the user changes the url (either by typing a new one or by clicking on a link for example).

Usually you will define most (if not all) your routes before starting your application.

	var app = new Monaco.Application();

	app.Router = Monaco.Router.extend({
		regExRoutes : {
			'^blog\\/posts\\/?$'			: 'listPosts',
			'^blog\\/posts\\/(\\d+)\\/?$'	: 'postDetail'
		}
	});

	app.start({ pushState: true });


We just defined two routes, but adding two properties to the `regExRoutes` Router object, notice that the key of each property is a regular expression that will be used to compare your urls against. The value of each property is a function that will be called whenever a url matches the regular expression.

Notes:
- define your routes by including the more specific at the top, and the more general more towards the bottom;
- if you want any value to be passed to the method you wrap the part to be passed by parenteses, in our regular expression for post detail we wrapp the digit `\\d+` with parenteses, so that it gets passed to the `postDetail` method.
- if you expects any query string parameters to be passed please include the `backbone-query-parameters` into your project (no extra configuration is needed) and on your method you can expect an extra `params` parameter as an object with the query parameter info.


Defining Routing Methods
------------------------

After you defined your routes you indicated that each regular expression should trigger a method, so we need to define the methods

	var app = new Monaco.Application();

	app.Router = Monaco.Router.extend({
		regExRoutes : {
			'^blog\\/posts\\/?$'			: 'listPosts',
			'^blog\\/posts\\/(\\d+)\\/?$'	: 'postDetail'
		}
	});

	app.Router.prototype.listPosts = function() {
		// get the list of post objects
		// create a view
		// render the view into the page
	};

	app.Router.prototype.postDetail = function(id) {
		// get the post with the passed id
		// create a view
		// render the view into the page
	};

	app.start({ pushState : true });

As you can see it is easy to create the router methods that will respond to the url mapping, I've included commets highliting the steps that should occor in order to present a view with data to the user, but before learning how to do that we need knowlege about Models, Collections, Views and Templates.


Creating Models and Collections
-------------------------------

A Model is a representation of an item from any resource from your application, for example: a client, a contact, an employee, etc. A collection would be a group of models you need for a specific reason.

To create a Model you would:

	app.models.User = Monaco.Model.extend();

Again you could pass an object with parameters that would change the default Monaco.Model, to see a list of available options please check the `Monaco API` doc

To create collections you would:

	app.collections.Contacts = Monaco.Collection.extend({
		model : app.models.User
		url : 'api.mysite.com/v1/users?filter=contact'
	});

	app.collections.Employees = Monaco.Collection.extend({
		model : app.models.User
		url : 'api.mysite.com/v1/users?filter=employees'
	});

On the previous code I've created two collections of items that uses the `app.models.User` as the model for both, but you can see that the url used to fetch the data from the server is different in each collection.

Check the `Monaco API` docs to see all the options you can use when creating models and collections.


Creating Views and Templates
----------------------------

A view/template is a visual representation of the state of your application. When developing web applications you have to break from the general server/client concept where the server ends the connection with the page after delivering it to the client. With Monaco application (through the view) keeps a connection with the page (template) at all times.

You can for example define events that will be triggered by your models and have your templates react to them on the fly, or define an interaction with your view will trigger something that will manipulate your data.

So the view is the link in between the application and the page code and the template is the page code that is rendered and visible to the end user.

To create a view please:

	app.views.ListContacts = Monaco.View.extend({
		el : '#contact-list'
		template : 'some string with the code to be added to the page'
	});

The previous code created a view that is linked with a template (useless now, since it is just a static string), and defined the element that this template will use to render itself (this element should already exist on the current state of the page)

To make the previous view more interesting lets create a real template and associate it with the previous view.

Tempaltes can be created as a separate files or be included inside of the main page that is rendered using script tags, the choice will depend on your application architeture.

the code for your template could be:

	<ul>
		<

The previous code is using the underscore template engine (underscore, or better lo-dash is a requirement for the Monaco framework). If your application have more than a couple of templates and/or your team is composed of more than just yourself I strongly suggest that you use a more robust template engine such as HandlebarsJS.

Now let's rewrite the previous view to properly connect your view with your newly created template

	app.views.ListContacts = Monaco.View.extend({
		el : '#contact-list',
		template : 
	});


Linking the router request with the themplate
---------------------------------------------

Let's go back to our route methods and create the logic to get the data and show the template:

	...
	app.Router.prototype.listPosts = function() {

	}


Summary
-------

This is the base of how to use monaco to create an application, you can check the entire source code of this sample application at (todo).

Monaco has many other resources to help you create your application, please make sure to check the Monaco API docs for more information.


