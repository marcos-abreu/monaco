(function(window, _, app) {

    // this filter will make sure that the shell view is rendered before the
    // controller gets executed - this is an example of a before filter
    app.router.addFilter('displayShell', function(func, args) {

        // if the `shell` is not available then render the shell and
        // store it for future references
        if (!app.get('shell')) {
            var shell = new app.views.Shell({ el : 'body' });
            shell.render();
            app.set('shell', shell);
        }

        // call the next filter in the queue or the controller if this is the
        // last filter
        func.apply(this, args);
    });

    // this filter will first execute the next function until it executes
    // the controller and then when it returns it will execute the code
    // that changes the selected menu - this is an example of an after filter
    app.router.addFilter('selectMenu', function(func, args) {
        var result = func.apply(this, args);

        // trigger custom event from the shell view that will result
        // in changing the selected menu item
        app.get('shell').trigger('select-menu');

        return result;
    });
}(window, window._, window.app));
