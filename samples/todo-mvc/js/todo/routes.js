// Todos Routes - to be registered when the application starts
(function(window, app) {
	'use strict';

	app.router.add({
		''           : 'showTodo',
		'*filter'    : 'setFilter'
	});

}(window, window.app));
