Monaco
====

***Monaco*** is a web application framework, built on top of the marvelous [*backbone.js*](http://backbonejs.org/), that offers a non-opinionated solution for developing small and large scale front-end applications.

*Backbone* is great as it stands, and offers the developer the ability to architect a solution any way it is needed, but it doesn’t offer a structure to tie the application code together, or to deal with common problems developers face on almost every app they build, such as local caching, or analytics integration, etc; All of that makes building applications much harder than it should be, ***Monaco*** is my take on solving these problems without forcing a develop to follow this or that convention.

To learn more about how ***Monaco*** works read the [getting started](/docs/getting-started.md) and the [platform overview](/docs/platform-overview.md) docs.

Monaco Modules
----

To accomplish all of that ***Monaco*** is divided into modules, where you can opt to use all or just some of them; whatever is needed to accomplish the task in hand. Each module is designed to help you active a specific requirement of your application.

Even if you decide to use all modules available, ***Monaco*** is just 5.5kb (minified and gzipped) - but it might be even smaller if you don’t need all modules.

- **monaco-application** - this is the core and the only required module of ***Monaco***; responsible for managing the application object and all elements added to it - [learn more](docs/modules/monaco-application.md).

- **monaco-local** - this module creates a local caching system that can be used to help you architect your application caching strategy - [learn more](docs/modules/monaco-local.md).

- **monaco-router** - this module allows you to easily add advanced routes using regular expressions; it also has a reverse router implementation that can be used to create smart links - [learn more](docs/modules/monaco-router.md).

- **monaco-views** - this module help you organize *master views* (screen views) and their subviews - [learn more](docs/modules/monaco-views.md).

- **monaco-transitions** - this module gives your application a way of setting up screen transitions, where each transition effect can be implemented based on your app requirements using any technology needed (e.g: javascript, css, or both) - [learn more](docs/modules/monaco-transitions.md).

- **monaco-analytics** - this module automatically sends a pageview tracking request every time you navigate to a different url and can be integrated with almost any analytics service provider - [learn more](docs/modules/monaco-analytics.md).

- **monaco-experiments** - this module allows you to create split tests (experiments) and divide your users appropriately; you can target different controllers, views, templates or template elements as you need - [learn more](docs/modules/monaco-experiments.md).


Monaco Command Line Interface (monaco-cli)
----

On top of all the features described above, ***Monaco*** also provides a really handy command line interface, that allows you get started with your projects and prototypes really fast. The use of **monaco-cli** is not required and you can build your apps using whatever structure of files and folders you want, but this tool is really handy if you need help creating the project file structure for your application. [Learn more](/docs/monaco-cli.md).


License
----

See [LICENSE](LICENSE)
