// App Initaal Configuration
(function(window, _, app){

    // set the initial state of the app shell
    app.set('shell', false);

    // sets the templates namespace for the app. This is not a default Monaco
    // namespace, but instead a namespace created specifically for this app. 
    // The following will create the namespace: `app.templates.directory` 
    // where `directory` is the name of one of our application modules
    app.templates = {
        directory : {}
    };

}(window, window._, window.app));