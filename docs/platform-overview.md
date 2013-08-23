platform-overview
====

Request/Response Cycle
----

On traditional web sites every time the user follows on a link, submits a form, or type another address direct on the browser, the browser sends a request to the server passing all the required information; the server then process the request collecting the necessary data and manipulating it; and then generates an html (most of the time) file and sends it back to the browser.

On modern web applications, the types you create with **Monaco** framework, the traditional request/response cycle doesn't apply.

The first difference is that on the first request the server responds with all the scripts necessary to run your entire application, this means that all the logic used to manipulate the data and generate the html are transfered to the client on the first request. This doesn't mean we don't need the server anymore, most applications will need to collect data from the server before manipulating it.

The first request of your application will follow the traditional request/response cycle, with the difference of bring to the client all the business logic of your application. After the first request you will use special navigation hooks to navigate between screens. This functionality allows you to change the url without making a round trip to the server.


As you can see when we navigate to a different url the front-end router matches the url and triggers a controller that will collect the necessary data (this might involve requesting it from a server); process the data and create views capable of presenting the data to the user.

There are a lot of pros and cons on both approaches (client apps vs server apps), please check this doc for a better understanding.


**Monaco.Application**
----

**Monaco.Application** allows you to create application objects that you can use throughout your code and that holds all elements you create on it. This is the core of the framework and most of the elements you will be working with has a reference to an instance of this class.

Please check the [**monaco.application**] doc for more information.

**Monaco.Router**
----

Your router is where you list all the routes you expect your user to be navigating when using your application. **Monaco.Router** inherits from Backbone.Router and therefore has all the functionality from it. **monaco-router** expand its functionality with easier to include regex routes as well as reverse routing. Check [the docs](/docs/monaco-router.md) for more info.

**Monaco Controller**
----

Controllers in **Monaco** most certanly don't follow the exaclty definition of an MVC paradign, but they serve the porpose of linking the code needed for your request to flow. Your controller will most certanly create the instances of your models and collections in order to fetch the necessary data, and also create an instance of a view capable of rendering the data in the screen. For that Monaco provides a `addController` method you will use to create your controllers. Check the [getting started](/docs/getting-started) docs for more info.

**Monaco.Model**
----

A model is basically one related unit of data, if you compare with a table in a database, then the model would be one row of the table where you would get all the related attributes of one item. **Monaco.Model** inherits from Backbone.Model and therefore have all the functionality available in it. It also attach a default error method for failed fetch calls.

**Monaco.Collection**
----

A collection is a list of data units, if you compare it with a table in a database, then the collection would be the table where you would have a list of models. **Monaco.Collection** inherits from Backbone.Collection and therefore have all the functionality available in it. It also attach a default error method for failed fetch calls.

**Local Caching**
----

Defining your local caching strategy can be chalenging, specially if you don't have the necessary tools. **monaco-local** provides the necessary hooks so you can define the caching strategy for your data. You will be able to define three levels of caching: App Level (disabling or enabling caching for all collections of your app); Collection Definition (controls the specific collection you are defining); Fetch Call (enable or disable caching per fetch call).

In adition to enabling and disabling caching you can also set the expiration for the data you are caching. All properties you use to define the caching (`resource`, `cacheLocal` and `cacheExpire`) can be assigned to a function what makes this configuration really flexible. Check [the docs](/docs/monaco-local.md) for more info.

**Moanco.View**
----

Views are classes that you can use to controll the behaviour of your ui elements. **Monaco.View** inherits from Backbone.View and therefore has all the functionality available in it. **monaco-view** extends this functionality by providing an easier way of managing subviews inside of a *master view*. A master view is just a view with one or more subviews.

By default whenever you instantiated **master view** all of its subviews will also be instanciated; and when you render a *master view* all of its subviews will also be rendered; and all subviews will be automatically removed just before removing their *master view*. Check the [**monaco-views** doc](/docs/monaco-view) for more info.

**Monaco.Transition**
----

**Monaco.Form**
----

**Analitics**
----

**Split Tests**
----

**Monaco Multirequests**
----
