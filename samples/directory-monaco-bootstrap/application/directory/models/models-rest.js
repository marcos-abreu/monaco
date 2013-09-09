/*
    If you are using the sample RESTFul services I published on GitHub, use the following URLs...

      - For the Node.js sample backend (available in https://github.com/ccoenraets/directory-rest-nodejs)
        Use: http://localhost:3000/employees

        If you are using this Node.js endpoint, the pages of the application must be served from the same domain/port (http://localhost:3000).
        If you want to serve the pages and the data from different domains/ports, use the JSONP adapter instead.

      - For the PHP sample backend (available in https://github.com/ccoenraets/directory-rest-php)
        Use: /directory-rest-php/employees

 */

(function(window, Monaco, app) {

    app.add('Employee', Monaco.Model.extend({
        urlRoot: '/directory-rest-php',

        initialize: function(id) {
            this.id = id;
        },

        url: function() {
            return '/employees' + this.id;
        }
    }));

    app.add('Employees', Monaco.Collection.extend({
        urlRoot: '/directory-rest-php',

        resource: 'employees',

        model : app.models.Employee,

        url: '/employees'

    }));

    app.add('Reports', app.collections.Employee.extend({
        initialize: function(id) {
            this.id = id;
        },

        url: function(){
            app.collections.Employees.prototype.url() + '/' + this.id + '/reports';
        }
    }));

}(window, window.Monaco, window.app));

