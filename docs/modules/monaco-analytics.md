monaco-analytics
====


Traditional web sites usually include a tracking javascript snippet on every page of the site, and when each page is loaded this script sends a request to the tracking service server to track pageviews. On web applications going from one screen to another never reloads the page and therefore we need different way to tracking pageviews.

**monaco-analytics** works by intercepting the request when we are trying to load a different url, and then sends a tracking request to the analytics service, you don't have to do anything special just use the normal navigate methods to go to a different url and the pageview request will be send.

Analytics Setup
----

On the page you load your scripts of your application you should include the analytics code as specified by your analytics service provider, the only thing you will need to change is to remove the line that tracks the current page, this way you will let the application loads the url and track the url through **monaco-analytics**.

sample:

    <html>
        <head>

            <!-- Google Analytics -->
            <script>
                (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
                (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
                m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
                })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

                ga('create', 'UA-9999-Y');
                // ga('send', 'pageview'); // The app will do that automatically

            </script>
            <!-- End Google Analytics -->

        </head>
        <body>
            ...
            
            <script src="http://www.sample.com/lodash.js"></script>
            <script src="http://www.sample.com/backbone.js"></script>
            <script src="http://www.sample.com/monaco.js"></script>
            <script src="http://www.sample.com/app.js"></script>
        </body>
    </html>

The example above uses google analytics service with the new `analytics.js` tracking code. Notice that we have commented out the line that would normally send a `pageview` request to google's server. The reason is that this page will be loaded through our application and therefore will be sending the `pageview` request through **monaco-analytics**.


Integrating with an analytics service
----

By default Monaco is integrated with Google Analytics (the new analytics.js), but it can be easily integrated with any other analytics service or with the old Google Analytics tracking (ga.js) if needed. To do that you will need to override the `trackPageview` method from the **Monaco.Application** class with your own implementation.

**application.trackPageview(fragment)**

where:

**fragment** : *string* : url fragment your application is navigation to

sample:

    Monaco.Application.prototype.trackPageview = function(fragment) {
        window._gaq.push(['_trackPageview', fragment]);
    };

The code above overrode the `trackPageview` method with the old google analytics implementation.


