monaco-app
==========

This is the core module of Monaco, and the only required module of the framework. This module allows you to keep your application code integrated.

App Configuration
-----------------

Every application needs to set some configuration, for example: active locale, .... Monaco accomplishes that by providing an application level getter and setter:

***set(key, value, cache)***

where:

**key** : *string* : key used to later retrive the information stored
**value** : *mixed* : any javascript value you want to store for latter use
**cache** : *boolean* : optional flag indicating if you want this information to be stored in local storage

sample:

            var myApp = new Monaco('my-application');
            myApp.start();

            myApp.set('language', 'en');


***get(key)***

where: 

**key** : *string* : key used to retrive the information stored

sample:

          myApp.get('language');

----





monaco-app - this is the core and the only required module of Monaco; responsible for the managing the application object and all elements added to it - learn more.
