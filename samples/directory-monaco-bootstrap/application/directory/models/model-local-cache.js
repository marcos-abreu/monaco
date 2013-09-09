(function(window, Monaco, app) {

    // Employee model class, used as the core item for employees collections, 
    // as well as the model for the employee profile detail
    app.add('Employee', Monaco.Model.extend({
        // flag indicating that no server call will be issued for this model
        localOnly: true,

        // root of the api call for this model
        urlRoot: '/directory-rest-php',

        // initialization method for this model
        initialize: function(attributes, options) {
            this.id = attributes.id;
        },

        // returns a string that will be appended to urlRoot as the complete
        // api request for this model
        url: function() {
            return '/employees' + this.id;
        }
    }));

    // generic collection of employees used whenever you need a list of
    // employees - check the more specialized collections below
    app.add('Employees', Monaco.Collection.extend({
        // unique identifier for this collection - used on local caching
        resource: 'employees',

        // flag indicating that no server call will be issued for this collection
        localOnly: true,

        // root of the api call for this collection
        urlRoot: '/directory-rest-php',

        // class used to control individual items of this collection
        model : app.models.Employee,

        // string that will be appended to urlRoot as the complete api
        // request for this collection
        url: '/employees'
    }));

    // specialized list of employees used on the search result list
    app.add('EmployeesSearch', app.collections.Employees.extend({

        // this method gets executed as a return of a fetch call, before any of the
        // models get included in the collection, this is your chance to sanitize
        // the data returned by the sync call before it is included in the collection
        // We will use this method to filter the data returned by the sync call when
        // searching for employees
        parse: function(items, options) {

            // filter the items returned when you are searching for strings in the name
            if (options.data.name && options.data.name != '') {
                return _.filter(items, function(item) {
                    var name = item.firstName + " " + item.lastName;
                    return name.toLowerCase().indexOf(options.data.name.toLowerCase()) > -1;
                });
            }

            return items;
        }
    }));

    // specialized list of employees used on the 'reports' section of the employee 
    // detail profile
    app.add('Reports', app.collections.Employees.extend({
        // initialization method executed when an instance of this collection
        // is created
        initialize: function(models, options) {
            this.profileId = options.id;
        },

        // returns a string that will be appended to urlRoot as the complete
        // api request for this collection
        url: function(){
            app.collections.Employees.prototype.url() + '/' + this.profileId + '/reports';
        },

        // this method gets executed as a return of a fetch call, before any of the
        // models get included in the collection, this is your chance to sanitize
        // the data returned by the sync call before it is included in the collection
        // We will use this method to filter the data returned by the sync call when
        // filtering by manager
        parse: function(items, options) {
            // filter items returned when they are being listed in the 'Reports' section
            // basically filter by manager
            return _.filter(items, function(item) {
                return item.managerId === this.profileId;
            }, this);
        }
    }));

}(window, window.Monaco, window.app));
