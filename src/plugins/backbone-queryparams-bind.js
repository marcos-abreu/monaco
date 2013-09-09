(function(window, _, Backbone) {
    'use strict';
    var Monaco = window.Monaco = (window.Monaco || {});

    /* 
        the goal of this script is to make Monaco works with Backbone Query Parameters
        the problem is that both of them rewrites the _routeToRegExp method in different ways

        Monaco applications will always call the Monaco version, but by using Backbone Query Parameters
        we want to call the original their version, but still compile the regex with Monaco's version.

        Solution Workflow:
            - Monaco Router calls Monaco._routeToRegExp
            - Monaco._routeToRegExp redirects to Backbone._routeToRegExp (our version of BQP._routeToRegExp)
            - Our version of BQP._routeToRegExp internally calls Monaco method ( saved as Monaco._routeToRE )

        For that you should include:
            - Backbone
            - Backbone Query Parameters
            - Monaco Framework
            - backbone-query-monaco-bind.js
    */


    // saves the original reference to Monaco's _routeToRegExp into a new method of the router instance
    Monaco.Router.prototype._routeToRE = Monaco.Router.prototype._routeToRegExp;

    // reverted Monaco to make use of the original Backbone's _routeToRegExp 
    // ( in this case our version Backbone Query Parameters )
    Monaco.Router.prototype._routeToRegExp = function(route) {
        return Backbone.Router.prototype._routeToRegExp.call(this, route);
    };

    // required regexp patterns from Backbone Query Parameters
    var splatParam    = /\*\w+/g,
        namedParam    = /(\(\?)?:\w+/g,
        namesPattern = /[\:\*]([^\:\?\/]+)/g;

    // Makes Backbone's _routeToRegExp call Monaco's BQP bind implementation of the method
    // This method is taken from Backbone Query Parameters, but with modifications to call
    // Monaco's method to convert the router into a regular expression, and then manipulate
    // it when it comes back.
    Backbone.Router.prototype._routeToRegExp = function(route) {
        var splatMatch = (splatParam.exec(route) || {index: -1}),
            namedMatch = (namedParam.exec(route) || {index: -1}),
            paramNames = route.match(namesPattern) || [];

        // original _routeToRegExp method from Backbone
        var routeRe = Monaco.Router.prototype._routeToRE.call(this, route);

        // convert the routeRe back to a string and append the necessary options
        // recreating the regex object after
        route = routeRe.toString(); // get the string for the regexp
        route = route.slice(1); // removed the first `/`
        var flags = route.slice(route.lastIndexOf('/')); // saves any flag
        route = route.slice(0, route.lastIndexOf('/')); // remove the last `/` with the flags
        route = route.replace('$', '([\?]{1}.*)?$'); // add the query string pattern
        var rtn = new RegExp(route, flags.slice(1)); // recreate the regexp object

        // use the rtn value to hold some parameter data
        if (splatMatch.index >= 0) {
          // there is a splat
          if (namedMatch >= 0) {
            // negative value will indicate there is a splat match before any named matches
            rtn.splatMatch = splatMatch.index - namedMatch.index;
          } else {
            rtn.splatMatch = -1;
          }
        }
        rtn.paramNames = _.map(paramNames, function(name) { return name.substring(1); });
        rtn.namedParameters = this.namedParameters;

        return rtn;
    };
}(window, window._, window.Backbone));
