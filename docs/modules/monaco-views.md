monaco-views
====

Views and subviews management are a key features of complex applications. Instead of stacking every functionality in one giant view, complex views can be broken into subviews so that the management of each task becomes contained in a simple context. This helps improve maintainability and helps prevent possible memory leaks.

**monaco-views** can help you manage complex views by simplifying the use of subviews in a *master view*. A *master view* is just a normal view with a list of subviews; subviews can have their own subviews becoming the *master view* of their subviews. When listing subviews you will use the following format:

**important**: during the examples below I'm going to use `Handlebars` as my template engine, you are free to use any template engine your project requires.

    app.add('MasterView', Monaco.View.extend({
        ...
        views : {
            '#css-selector' : { template: Handlebars.templates['my-template'] },
            '.css-selector' : { template: Handlebars.templates['my-other-template'] }
        }
        ...
    }));

Subviews are listed as object literal where each key correspond to a css selector that will be assigned as the element of the view, and the value as being another literal object with options for configuring the subview.

The following are the options you can pass for each subview:

**template** : *string* : view html template that will be used by the `render` method  
**classView** : *object* : Monaco base view class to be used when creating the new subview  
**collectionItem** : *boolean* : flag indicating if we will have one subview per collection item or not  
**collection** : *object* : Monaco collection object to be used as master collection for the subview  
**model** : *object* : Monaco model object to be used as master model for the subview  
**autoRender** : *boolean* : flag indicating if the view should be rendered just after the *master view* is - `true` by default  

----

**css selector** : the css selector will be assigned to the subview as their target element if non `classView` is assigned to the subview. The selector will serve as the wrapper where the subview will be rendered - so the element the selector targets should be on the DOM tree by the time the subview is rendered ( this is usually accomplished by rendering the DOM element associated with the selector on the *master view* ).


Creating simple subviews
----

The simplest type of subview are the ones that don't have a specified view class (`viewClass`) associated with them, they just have a `template` and will be created automatically by **monaco-views** (using the base `Monaco.View` class) as soon as the *master view* is created; it will be rendered as soon as the *master view* is rendered; and removed just before the *master view* gets removed.

    var app = new Monaco.Application('mobile');

    var app.add('UserProfile', Monaco.View.extend({
        ...
        template: Handlebars.templates['user.profile'],
        views : {
            '#profile-status'  : { template: Handlebars.templates['user.profile-status'] },
            '#featured-videos' : { template: Handlebars.templates['user.featured-videos'] },
            '#friends'         : { template: Handlebars.templates['user.friends-list'] }
        },
        ...
    }));

The code above created a sample Monaco application `app`;  then added the `UserProfile` view to the application with a list of three subviews using the `views` property; each one with a key as a css selector and the value as a literal object with options for the subview. In this example the only option for each of the subviews is their `template` what means that they will be created using the base `Monaco.View` class.

----
Following the previous example whenever we instantiate a new `UserProfile` view object we will create instances of each one of its subviews.

    var profile = new app.views.UserProfile();

----
Whenever we render the instance of the `UserProfile` view, the subviews instances will also be rendered.

    profile.render();

---
Whenever we remove the `UserProfile` instance object the instance of the subviews will be automatically removed.

    profile.remove();


Adding Complex Subviews
----

When a subview is complex enough to have its own behaviour (needs their own view class), we can accomplish this using the `viewClass` property.

    var app = new Monaco.Application('mobile');

    app.add('ProfileFriends', Monaco.View.extend({
        // logic from the profile views class
    }));

    app.add('UserProfile', Monaco.View.extend({
        ...
        views : {
            '#profile-status'   : { template : Handlebars.templates['user.profile-status'] },
            '#featured-videos'  : { template : Handlebars.templates['user.featured-videos'] },
            '#friends'          : { viewClass : app.views.ProfileFriends }
        },
        ...
    });

The example above is almost the same as the previous one, the only difference is that the '#friends' subview is assigned to an object that has a `className` property instead of a `template` property. Again the subviews will be instantiated just after the *master view* is instantiated; they will be rendered just after the *master view* is rendered; and they will be removed just before the *master view* is removed.

By using this method of assigning a `viewClass` to a subview you have the ability to completely control the behaviour of the subview.

One subview for each model of a view's collection
----

Often we need to use subviews to render each one of the view collection's models. This can be accomplished in **monaco-views** as demonstrated below:

    var app = new Monaco.Application('mobile');
    app.add('UserVideoList', Monaco.View.extend({
        ...
        views : {
            '#video-list'    : { template : Handlebars.templates['video.item'], collectionItem : true }
        }
        ...
    }));

The `collectionItem` *boolean* property when set to `true` (`false` by default) indicates that this subview should be rendered once for each model inside of the view's collection.

If the collection you want to iterate is not the main collection of the view you could:

    var app = new Monaco.Application('mobile');
    app.add('UserVideoList', Monaco.View.extend({
        initialize : function() {
            this.videoList = new app.collections.Videos();
            this.videoList.fetch();
        },

        ...
        views : {
            '#video-list'    : { 
                template : Handlebars.templates['video.item'], 
                collectionItem : true, 
                collection : this.videoList
            }
        },
        ...
    }));

By using the `collectionItem` and `collection` properties together in the code above the `this.videoList` won't be assigned to the subview as its collection, but instead for each of the `this.videoList` models one subview will be rendered.

The previous two examples I've used simple subviews (just listed the `template` they will be using), but you can accomplish the same thing with more complex subviews where you need to control their behaviour. Just use the `viewClass` property as explained before.

    var app = new Monaco.Application('mobile');
    
    app.add('VideoItem', Monaco.View.extend({
        initialize : function(options) {
            this.listenTo(this.model, 'change', this.render);
        },
        
        render : funcction() {
            // return the html for one element based on this.model
        }
    });

    app.add('UserVideoList', Monaco.View.extend({
        ...
        views : {
            '#video-list'    : { viewClass : app.views.VideoItem, collectionItem : true }
        }
    }));


Accessing Specific Subviews
----

**monaco-views** gives you access to each subviews through the view's `children` property. Lets say for example that based on a user click you want one of the subviews to re-render itself.

    var app = new Monaco.Application('mobile');

    var app.add('UserProfile', Monaco.View.extend({
        ...
        views : {
            '#profile-status'  : { template: Handlebars.templates['user.profile-status'] },
            '#featured-videos' : { template: Handlebars.templates['user.featured-videos'] },
            '#friends'         : { template: Handlebars.templates['user.friends-list'] }
        },
        
        events : {
            'click #reload-button' :      'reloadFeaturedVideos'
        },
        
        reloadFeaturedVideos : function(evt) {
            var newVideos = new app.collections.Videos(null, { featured : true });
            newVideos.fetch({
                success : _.bind(function(collection, xhr, options) {
                    this.children['#featured-videos'].render(newVideos.toJSON());
                }, this),
                ...
            });
        },
        ...
    }));


If you used the `collectionItem` assigned to `true`, then the `this.children['#css-selector']` will be an array of subviews.

Accessing the *master view* from a subview
----

You can also access the *master view* from one of its subviews by using the `parent` property of a subview.

    var app = new Monaco.Application('mobile');
    
    app.add('VideoItem', Monaco.View.extend({
        initialize : function(options) {
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.parent, 'flip', this.hide);
        },
        
        render : funcction() {
            // return the html for one element based on this.model
        },
        
        hide : function() {
            ...
        }
        ...
    });

    app.add('UserVideoList', Monaco.View.extend({
        ...
        views : {
            '#video-list'    : { viewClass : app.views.VideoItem, collectionItem : true }
        },
        
        events : {
            'click #flip-button' : 'flipList'
        },
        
        flipList : function(evt) {
            // logic to flip the list
            this.trigger('flip');
        },
        ...
    }));

Advanced Use of **monaco-views**
----

### blocking view rendering

Sometimes you need to have control on when a specific subview is rendered, for that you can use the `autoRender` options setting it to `false` - this property is set to `true` by default.

In this case the css selector assigned to the subview doesn't need to be in the DOM tree by the time the *master view* is rendered.


### add another subview dynamically

If you need to add another subview to a *master view* (or any view) after this view has been instantiated (and even after it has been rendered) you can use the `add` method available in any `Monaco.View` object.
