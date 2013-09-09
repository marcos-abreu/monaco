// Todo Models and Collections
(function(window, app) {
    'use strict';

    // Todo Model - Our basic **Todo** model has `title`, `order`, and `completed` attributes.
    app.add('Todo', Monaco.Model.extend({
        // flag indicating that just local cached data will be used (no server requests)
        localOnly: true,

        // Default attributes for the todo
        // and ensure that each todo created has `title` and `completed` keys.
        defaults: {
            title: '',
            completed: false
        },

        // Toggle the `completed` state of this todo item.
        toggle: function() {
            this.save({
                completed: !this.get('completed')
            });
        }
    }));

    // Todos Collection - The collection of todos
    app.add('Todos', Monaco.Collection.extend({
        // resource key used by local storage
        resource: 'todos',

        // flag indicating that just local cached data will be used (no server requests)
        localOnly: true,

        // activate the local caching for this collection
        cacheLocal: true,

        // set to never expire
        expireLocal: null,

        // collections model class
        model: app.models.Todo,

        // Filter down the list of all todo items that are finished.
        completed: function () {
            return this.filter(function (todo) {
                return todo.get('completed');
            });
        },

        // Filter down the list to only todo items that are still not finished.
        remaining: function () {
            return this.without.apply(this, this.completed());
        },

        // We keep the Todos in sequential order, despite being saved by unordered
        // GUID in the database. This generates the next order number for new items.
        nextOrder: function () {
            if (!this.length) {
                return 1;
            }
            return this.last().get('order') + 1;
        },

        // Todos are sorted by their original insertion order.
        comparator: function (todo) {
            return todo.get('order');
        }
    }));

}(window, window.app));
