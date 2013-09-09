(function(window, Monaco, _, $, app) {

    // Generic EmployeeList - check the more specialized types of EmployeeList
    // views below.
    app.add('EmployeeList', Monaco.View.extend({

        // Template used when rendering this view, it is currently disabled
        // since we are asynchronously loading the templates. For a complete
        // explanation check the code and comments on index.html
        // template: _.template(app.templates['employee-list']),
    }));

    // Specialized EmployeeList view to manage the search result list
    // that is rendered under the shell search bar
    app.add('EmployeeSearchResult', app.views.EmployeeList.extend({

        // method executed when an instance of this class is created, use it
        // to set the initial state of the class instance
        initialize: function() {
            this.listenTo(this.collection, 'add', this.addOne);
            this.listenTo(this.collection, 'reset', this.render);
        },

        // render the ui for this view
        render: function() {
            // clear the content of the current el
            this.$el.empty();
            // render each model of the view's collection
            this.addAll();

            // returns the view instance so you can chain other commands after
            // rendering the view
            return this;
        },

        addOne : function(model, options, fromAddAll) {
            var item = new app.views.EmployeeListItem({model: model}),
                content = item.render().el;

            // If I'm running the addOne method as part of the addAll, then just
            // return the generated content that by the end of the addAll the
            // content will be rendered altogether
            if (fromAddAll === true) {
                return content;
            }

            // The default action is to render the content on the page, unless
            // the previous condition was satisfied
            $('ul.dropdown-menu').append(content);
        },

        addAll : function(obj, options) {
            var collection = obj || this.collection,
                result = [];
            options = options || {};

            // loop over all the collection's models and create an array
            // with the rendered html for each one
            this.collection.each(function(model) {
                result.push(this.addOne(model, options, true));
            }, this);

            // append all the rendered content into the DOM at once
            $('ul.dropdown-menu').html(result);
        }
    }));

    // Specialized EmployeeList view to manage the employee reports
    // contact list
    app.add('EmployeeReport', app.views.EmployeeList.extend({
        tagName: 'ul',

        className: 'nav nav-list',

        // subviews of the employee list - subviews gets created and rendered
        // just after the master view does, and they get removed just before
        // removing the master view.
        views: {

            // subview case where for each model of the provided collection (if
            // collection is not provided it will use this.collection) a new 
            // instance of the class will be created.
            'ul.nav-list' : {

                // using an anonymous function that returns a Monaco view class
                // allows us to assign a view class that is not available now,
                // but it will be when the master view gets instantiated
                viewClass: function(){ return app.views.EmployeeListItem; }, 

                // this flag indicates that a new viewClass will be create for
                // each model of the collection
                collectionItem: true 
            }

            // NOTE: for subviews like the above Monaco will dynamically create
            // two methods on this master view (addOne and addAll) and will
            // assign event listeners to the collection to respond to the `add`
            // and `reset` events of the collection accordingly
        }
    }));


    // View Class used to build and render each item of an EmployeeList View
    app.add('EmployeeListItem', Monaco.View.extend({

        // Template used when rendering this view, it is currently disabled
        // since we are asynchronously loading the templates. For a complete
        // explanation check the code and comments on index.html
        // template: _.template(app.templates['employee-list-item']),

        tagName: 'li',

        // method executed when an instance of this class is created, use it
        // to set the initial state of the class instance
        initialize: function() {
            this.listenTo(this.model, 'change', this.render, this);
            this.listenTo(this.model, 'destroy', this.remove, this);
        },

        // render the ui for this view
        render: function(data) {

            // if no data is passed then use the view's model as data
            var data = data || this.model.toJSON();

            // renders the template storing it inside the view's element container
            this.$el.html(this.template(data));

            // returns the view instance so you can chain other commands after
            // rendering the view
            return this;
        }
    }));

    // View Class - responsible to render an employee profile ui
    app.add('Employee', Monaco.View.extend({

        // Template used when rendering this view, it is currently disabled
        // since we are asynchronously loading the templates. For a complete
        // explanation check the code and comments on index.html
        // template: _.template(app.templates['employee']),

        // method executed when an instance of this class is created, use it
        // to set the initial state of the class instance
        initialize : function() {
            this.reports = new app.collections.Reports(null, { id: this.model.id });
            this.listenTo(this.reports, 'sync', function(resp, xhr, options) {
                if (resp.length === 0) {
                    $('.no-reports').show();
                }
            });

            this.on('rendered', this.onRendered);
        },

        // inject this view rendered content into the html page using the \
        // `content` element as a container
        onRendered: function() {
            $(this.el).appendTo('#content');
            this.reports.fetch({reset: true});
        },

        views: {
            '#details' : { 
                viewClass: function() { return app.views.EmployeeSummary; }
            },
            '#reports' : { 
                viewClass: function() { return app.views.EmployeeReport; },
                collection: function() { return this.reports; }
            }
        },

        // render the ui for this view
        render: function() {

            // renders the template (using its model data to feed the template
            // variables) and storing the result inside the view's element
            // container
            this.$el.html(this.template(this.model.toJSON()));

            // returns the view instance so you can chain other commands after
            // rendering the view
            return this;
        }
    }));

    // Subview Class of an Employee Class to ....
    app.add('EmployeeSummary', Monaco.View.extend({

        // Template used when rendering this view, it is currently disabled
        // since we are asynchronously loading the templates. For a complete
        // explanation check the code and comments on index.html
        // template: _.template(app.templates['employee-summary']),

        // method executed when an instance of this class is created, use it
        // to set the initial state of the class instance
        initialize: function() {
            this.listenTo(this.model, 'change', this.render, this);
        },

        // render the ui for this view
        render: function() {

            // renders the template (using its model data to feed the template
            // variables) and storing the result inside the view's element
            // container
            this.$el.html(this.template(this.model.toJSON()));

            // returns the view instance so you can chain other commands after
            // rendering the view
            return this;
        }
    }));

}(window, window.Monaco, window._, window.jQuery, window.app));
