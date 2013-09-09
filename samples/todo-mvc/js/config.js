// configuration file - sets the initial state of your application
(function(window, app) {
    'use strict';

    // set a constant for key code
    window.ENTER_KEY = 13;

    // set initial filter to empty
    app.set('filter', null);

    // sets the initial cached list for the todos resource collection
    if (!app.local.get({resource: 'todos', models:[]})) {
        app.local.set({resource: 'todos', models:[]}, [], null);
    }
}(window, window.app));
