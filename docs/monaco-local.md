In order to increase the responsiveness of your application, you need to decide on a caching strategy.

As part of a caching strategy you may decide to pre-fetch some resources and/or keep some resources locally avaialble whenever you fetch them, so that subsequent requests doesn't need to be done not even verified. As well as offline changes can be persisted even if your app crashes, before the data is transfered to the server.

`Monaco.local` attempts to give you tools to help you develop the best caching strategy for your application

features:

	- local caching workflow:
		- Identify the collection data that should be avaialble on the request of the first page of the application
			- store the data as a JSON object using the `prefetched` options when creating the Monaco application
		- Decide if you application should cache all collections or not
			- global `cacheLocal` propery when creating a Monaco application
		- Identify the collections that should always be cached
			- set `cacheLocal` property to true when defining the collection
		- identify specific `collection.fetch` requests that you want to store locally, but you haven't set the collection `cacheLocal` (or the global `cacheLocal`)
			- use the `cacheLocal` option when calling the `collection.fetch` method
		- identify specific `collection.fetch` requests that you DO NOT want to store locally, but you HAVE set the collection `cacheLocal` (or the global `cacheLocal`)
			- use the `cacheLocal` option when calling the `collection.fetch` method
		- identify specific `collection.fetch` requests that you want always to reach the server (bypassing the local data stored)
			- use the `fresh` option when calling the `collection.fetch` method. Remember to verify if you want the result data to be cached or not (`cacheLocal` option)


- always check local data before attempt to get it from the server

	attempts to read a collection will always check if the data is available locally before attempting to perform an Ajax call.

- set the default behaviour globally:

	By default Monaco won't cache any fetched data, unless you explicity tell it to; but as previously mentioned it will always try to get the data from the local cache when a collection is requested.

	Some application may not require a lot of data from the server, and therefore would beneffit from having a caching system that would store all collection.fetch calls locally by default, to change the default behaviour of `Monaco.local` set the `localCahe` and `defaultExpiration` (optional) properties when creating a new Monaco application:

	window.app = new Monaco.Application({
	    'cacheLocal' : true // indicates that the data should be cached by default after ajax reads and writes
	    'defaultExpiration': 20 // default expiration time in minutes - defaults to 30 minutes if not provided
	});

- store pre-fetch calls

	In some cases it is preferable to pre-fetch data so your application doesn't have to wait for a server request when the data is required.

	- store prefetched data when you create the application

	window.app = new Monaco.Application({
        prefetched : {
            users : [{"id": 1, "first_name": "john"}, {"id": 2, "first_name": "maria"}],
            featured : [{"id": 1, "title": "super"}, {"id": 2, "title": "not so super"}]
        }
	});

	- store the prefetched data on demand

	you can always prefetch a content by issuing a `collection.fetch` - if the `cacheLocal` is enabled by default this call will store the data locally, if not check the `Cache sepcific resources only` section bellow.

- local cache expiration

	As we saw earlier you can use the available `defaultExpiration` time of 30 minutes, or you can set your desired `defaultExpiration` time when creating your Monaco application. But a good local caching strategy should allow you to customize the expiration time as you feel adequate.

	- overwrite the `defaultExpiration` per request when storing the data
		Monaco.local.set(obj, resp, 10);

	- cache resource indefinetly when storing the data
		Monaco.local.set(obj, resp, null);

- Cache specific resources only

	As pointed earlier not all applications should set the `cacheLocal` to true by default. Applications that utilizes a lot of data, should be really carefull with the amount of data it stores locally:
		- local data consumes memory
		- on mobile memory consumptions influencies in battery usage

	 If your application `cacheLocal` is disabled (it is disabled by default), you can cache the collection fetch result by passing `cache : true` when fetching a collection.

	 var users = new app.collections.User();
	 users.fetch({
	 	success : function(collection, resp) {
	 		...
	 	},
	 	error : function(collection, resp) {
	 		..
	 	},
	 	cache : true
	 });

	 Alternatively if you want to have more control over the data that will be cached you can use the `success` callback to cache the data:

	 var comments = new app.collection.Comments();
	 comments.fetch({
	 	success : function(collection, resp) {
	 		if (resp.0.name == 'Tom') {
	 			resp.0.name = 'John';
	 		} 
	 		Monaco.local.set(collection, resp);
	 		...
	 	},
	 	error : function(collection, resp) {
	 		...
	 	}
	 });

	 Be careful when manipulating the response and storing it, becuase the next collection fetch command will get the local data (manipulated data) instead of the raw server data (non-manipulated data). Keeping them syncronized might become an issue.

- Bypassing the local data if needed 

	If you need to bypass the local data stored and fetch the most recent data from the server, you can do so by setting the `fresh` options property to `true`.

	var users = new app.collections.User();
	users.fetch({
		success : function(collection, resp) {
			...
		},
		error : function(collection, resp) {
			..
		},
		fresh : true
	});

	If the `cacheLocal` is enabled, but you don't want to replace your local cached data with the fresh one that just came from the server you can set the `cache` property to `false` when performing a collection fetch:

	var users = new app.collections.User();
	users.fetch({
		success : functon(collection, resp) {
			...
		},
		error : function(collection, resp) {
			...
		},
		fresh : true,
		cache : false
	});

- Remove local cached data

	Aside from the expiration time that allows you to indicates when the data is not valid anymore, you can explicitly clear the cached data, freeing up memory and localStorage space.

	- clear the entire application local data: `Monaco.local.clear();`
	- clear data from a especific collection: `Monaco.local.clear('resourceName');`
	- remove one item from the local collection data: `Monaco.local.clear('resourceName', 'itemID');` where `itemID` is the id of the model (not yet implemented)





