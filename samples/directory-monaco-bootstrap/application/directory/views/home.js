(function(window, Monaco, _, $, app) {
    app.add('Home', Monaco.View.extend({
        // Template used when rendering this view, it is currently disabled
        // since we are asynchronously loading the templates. For a complete
        // explanation check the code and comments on index.html
        // template: _.template(app.templates['home']),

        // method executed when an instance of this class is created, use it
        // to set the initial state of the class instance
        initialize: function(options) {
            this.on('rendered', this.onRendered);
        },

        // inject this view rendered content into the html page using the
        // `content` element as a container
        onRendered: function() {
            $(this.el).appendTo('#content');
        },

        // render the ui for this view
        render: function() {
            this.$el.html(this.template());

            // returns the view instance so you can chain other commands after
            // rendering the view
            return this;
        },

        events: {
            'click #showMeBtn' : 'showMeBtnClick'
        },

        showMeBtnClick: function() {
            app.get('shell').search();
        }
    }));
}(window, window.Monaco, window._, window.jQuery, window.app));
