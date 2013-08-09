(function(window) {

    var Monaco = window.Monaco = (window.Monaco || {});

    /* -- ROUTER ----------------------------------------------------------- */
    Monaco.Router = Backbone.Router.extend({
        // override the Backbone Router constructor
        constructor : function() {
            var _self = this,
                initialize = this.initialize; // keep the origina initialize method
            // wrap the initialize method to bind the regular expression routes
            this.initialize = function() {
                _self._bindRegExRoutes();
                initialize.apply(_self, arguments);
            };
            Backbone.Router.prototype.constructor.apply(this, arguments);
        },

        // Bind all defined regExRouters. The order needs to be reversed to make
        // sure more specific routes can be defined above general routes
        _bindRegExRoutes : function() {
            if (!this.regExRoutes) return;
            var routes = [];
            for(var i = (this.regExRoutes.length - 1), j = 0; i >= j; i--) {
                for (var route in this.regExRoutes[i] ) {
                    routes.unshift([route, this.regExRoutes[i][route]]);
                }
            }
            var reParams = '([\\?]{1}.*)?';
            for (var a = 0, b = routes.length; a < b; a++) {
                var key = routes[a][0],
                    method = _.isArray(routes[a][1]) ? routes[a][1][0] : routes[a][1];
                // add query string pattern to each route // todo verify what to do if this isn't the case
                var re = key.slice(-1) == '$' ? key.slice(0, -1)+reParams+'$' : key+reParams;
                this.route(new RegExp(re), method);
            }
        }
    });
}(window));