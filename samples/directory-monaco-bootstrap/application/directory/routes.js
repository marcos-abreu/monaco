(function(window, app) {

    // routes to be registered when the application starts
    app.router.add({
        ''              : 'home',
        'contact'       : 'contact',
        'employees/:id' : 'employeeDetails'
    });

}(window, window.app));

