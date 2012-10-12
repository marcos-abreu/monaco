monaco
======

Monaco is a web application framework build on top of the incredible backbone.js (https://github.com/documentcloud/backbone), giving it a more defined application archteture.

dependencies
------------

- backbone.js (and all its dependencies)
- underscoer.js (preferably lo-dash)
- DOM selector (CSS Selector) library - TODO: verify how to remove/reduce this dependency

features
--------

- application object with a centralized dispatcher

- local caching collection data - allowing you to keep the data fetched from a collection locally (memory and/or localStorage), therefore reducing the number of calls to the server

- default view - with a default render that appends the content to the page and a default close method that unbinds all events and remove the element to the page

- inner views - easy and flexible way of including subviews inside of your view

- helpers that make your life as a developer easier, such as: fetchCollections, ...

- easier way to define regular expression routes

- automatically pass any query string parameters as an object to the callback function

- flexible transition engine that allows you to move from view to view - use the transitions that comes with Monaco or build your own transitions.

- validation (input and model) engine that allows you to easily maintain the state of the data that flows into your application

- flexible form engine to facilitate the integration between input, validation and model storage

- scafolding that gives you a quick start on building your application


Usage
-----

Please check the `docs/monaco-usage.md` to have an overview of how to use Monaco to build your app.

