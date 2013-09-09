(function(window, _, app) {

    app.utils = app.utils || {};

    // Loads external app module template files and execute a callback when
    // all the templates are loaded. The templates will be cached in the 
    // application `templates.module.templatename` namespace
    app.utils.loadTemplates = function(appModule, templates, callback) {
        var deferreds = [];

        // loop over the templates array submitting a get request for each 
        // and storing the request call in an array
        $.each(templates, function(index, template) {
            var href = window.location.origin + window.location.pathname;
            href = href.lastIndexOf('/') === (href.length - 1) ? href : href + '/';
            deferreds.push(
                $.get(href + appModule +  '/templates/' + template + '.html', 
                        function(resp, status, xhr){
                            app.templates[template] = resp;
                        }, 'html')
                 .fail(function(xhr, status, error) {
                    window.log(template + '.html  not loaded - Error: ' + status);
                 })
            );
        });

        // uses jQuery promise interface to trigger the callback when 
        // all the requests stored finish with success
        $.when.apply(null, deferreds).done(_.bind(function() {
            callback.apply(this, arguments);
        }, this));
    };

    // really simplistic wrapper of `console.log`, so that browsers that don't
    // support it (i.e. Internet Explorer) don't explode. For the non-supported
    // browsers you can still get the log by inspecting: `window.log.history`
    // from: https://github.com/marcos-abreu/console-log-wrapper
    window.log = function() {
        log.history = log.history || [];
        log.history.push(arguments);
        if (typeof console !== "undefined" && console.log) {
            return console.log.apply(this, arguments);
        }
    };
}(window, window._, window.app));
