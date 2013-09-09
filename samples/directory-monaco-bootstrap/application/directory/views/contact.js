(function(window, Monaco, _, $, app) {

    app.add('Contact', Monaco.View.extend({

        // Template used when rendering this view, it is currently disabled
        // since we are assyncrousnoly loading the templates. For a complete
        // explanation check the code and comments on index.html
        // template: _.template(app.templates['contact']),

        // method executed when an instance of this class is created, use it
        // to set the initial state of the class instance
        initialize: function(options) {

            // listens for the 'rendered' event of this view and trigger the
            // `onRendered` method when it occours
            this.on('rendered', this.onRendered);
        },

        // after this view gets rendered this method will append its content into
        // the DOM this way when this view gets removed the wrapper (#content)
        // will remain in the DOM and just the views el will be removed.
        onRendered: function() {
            // inject this view rendered content into the html page using the \
            // `content` element as a container
            $(this.el).appendTo('#content');
        },

        // render the ui for this view
        render: function() {

            // renders the template storing it inside the view's element container
            this.$el.html(this.template());

            // returns the view instance so you can chain other commands after
            // renderig the view
            return this;
        }
    }));

}(window, window.Monaco, window._, window.jQuery, window.app));
