// Todos Router Callbacks - where you will collect the data and 
// instanciate the necessary views
(function(window, app){
	'use strict';

	app.router.on('route:showTodo', function(param) {
		// if filter has been initialized than filter to all
		if (app.get('filter') !== null) {
			return app.router.trigger('route:setFilter', '');
		}

		// creates a new instance of the todos collection
		var todos = new app.collections.Todos();

		// make sure to store the reference of the collection instance
		app.set('todos', todos);

		// fetch the collection data
		todos.fetch({
			success: function(collection, resp, options) {
				// create an instance of the application screen view
				var appScreen = new app.views.AppScreen({ collection: collection });

				// transition to this screen - by rendering it
				app.transitionTo(appScreen);
			}
		});
	});

	app.router.on('route:setFilter', function(param) {
		// Set the current filter to be used
		app.set('filter', param);

		// Trigger a collection filter event, causing hiding/unhiding
		// of Todo view items
		app.get('todos').trigger('filter');
	});
}(window, window.app));