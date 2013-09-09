// Directory Module - Controllers (Router Callbacks)
(function(window, _, app){

    // will create and transition to the home screen executing a queue of 
    // filters before the controller gets called
    app.router.on('route:home', app.router.filter(['displayShell', 'selectMenu'], function() {
        // Since the home screen never changes, we instantiate it only once
        if (!app.get('homeScreen')) {
            var home = new app.views.Home();
            app.set('homeScreen', home);
        }

        // transition to the home screen by executing the default transition
        // `start` method this method will among other things render the view
        // in this case the home screen
        app.transitionTo(app.get('homeScreen'));
    }));

    // will create and transition to the contact screen executing a queue of 
    // filters before the controller gets called
    app.router.on('route:contact', app.router.filter(['displayShell', 'selectMenu'], function() {
        // Since the contact screen never changes, we instantiate it only once
        if (!app.get('contactScreen')) {
            var contact = new app.views.Contact();
            app.set('contactScreen', contact);
        }

        // transition to the contact screen by executing the default transition
        // `start` method this method will among other things render the view
        // in this case the contact screen
        app.transitionTo(app.get('contactScreen'));
    }));

    // will create and transition to the employee screen based on the id 
    // provided executing a queue of filters before the controller gets called
    app.router.on('route:employeeDetails', app.router.filter(['displayShell', 'selectMenu'], function(id) {

        // creating a new Employee instance. Notice that we are passing a 
        // collection instance as an options, this way when we try to fetch
        // the model **monaco.local** will inspect in the cached data for
        // the collection before attempting to recover the data in any other way
        var employee = new app.models.Employee({id: parseInt(id, 10)}, { collection : new app.collections.Employees() });

        employee.fetch({
            success: function(model, resp, options) {
                var employee = new app.views.Employee({ model: model });

                // transition to the employee screen by executing the default 
                // transition `start` method that will among other things
                // render the view - in this case the employee screen
                app.transitionTo(employee);
            }
        });
    }));

}(window, window._, window.app));
