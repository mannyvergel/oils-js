oils
======

### What is Oils JS

Oils is a web framework built on top of Express framework. It's very flexible and very simple to use, you'll love it!

The reason why Oils framework was created is because the author wants a framework that just works; framework that is very close to Express, organized, highly intuitive and uses basic html, css, and javascript.

The author is **NOT** a fan of the ff:

* using non-html syntax on the front-end
* forcing to use sass / other css frameworks
* forcing non standard javascript syntax
* complicated build procedures before you can run the app

The default configuration is for running on local machine and on Openshift servers but it's configurable in conf.js.

#### Latest Release(s)

Version 0.2.4 ([Download](https://github.com/mannyvergel/oils-js/archive/v0.2.4.zip))
* support for custom routes in controllers

Version 0.2.3 ([Download](https://github.com/mannyvergel/oils-js/archive/v0.2.3.zip))
* support for routing verbs: get, post, put, delete, options, all
* support for regexp in routes
* bug fixes

Version 0.2.2 ([Download](https://github.com/mannyvergel/oils-js/archive/v0.2.2.zip))
* Streamlined plugin support
* Added authentication plugin [oils-auth-local](https://github.com/mannyvergel/oils-auth-local)

#### Directory Structure

    |-- lib               //custom js
    |-- oils          
    |   |-- conf          //configuration and routes    
    |   |-- plugins       //plugins   
    |-- web          
    |   |-- controllers   //controllers    
    |   |-- models        //models for mongoose db  
    |   |-- public        //assets like css, js, images
    |   |-- views         //uses swig for templating


You can see the README.md's of each directory above for more information.

#### Noteworthy Helper Functions

##### ```include(path)```

You can use ```include``` function which is basically like ```require``` except that it's based on the the project directory if the path starts with '/'.

E.g. Consider the ff structure:

    |-- web          
    |   |-- controllers  
    |       |--folder
    |          |--subfolder
    |             |--controller1.js    
    |-- lib
    |   |--folder
    |      |--subfolder
    |         |--lib1.js  

If you are in controller1.js and you want to import lib1.js

Instead of using:

````
var lib1 = require('../../../../lib/folder/subfolder/lib1.js');
```

Use 

```
var lib1 = include('/lib/folder/subfolder/lib1.js');
````

##### ```includeModel(path)```

loads a model based on the path and returns a Mongoose Model. The path also behaves like ```include``` i.e. if it starts with '/' it will base the path on the project's directory.

e.g.
```
var Book = includeModel('/web/models/Book.js');
```

##### ```models('modelName')```

A convenience function for ```includeModel```

e.g.
```
var Book = models('Book');
```

### Components
Oils js uses Mongoose for ORM, Mongo DB for the database and Swig for templating. Only Mongo DB is supported for now but this may change in the future depending on the needs.

For the default templating, Swig has been chosen because it doesn't mess much with the html syntax. You can override this by setting the attributes of app.server before calling app.start(), however, do this at your own risk as future features may not support custom template engines (e.g. scaffolding).

### Features

The follow are motivations behind creating Oils Js Framework:

+ Intuitive MVC approach
+ Automatic routing of controllers
+ Organized folder structure
+ Organized importing of js files using "include"
+ Automatic creation of models and controllers
+ Uninterrupted Mongo DB Connection (auto reconnect)
+ Support for multiple database connections
+ Uninterrupted server when there's an exception
+ Plugin support

Future Features:

+ Scaffolding

### Set-Up

This assumes you already have Node JS v0.10.x (or higher) installed.

```
> npm install oils -g

> oils new HelloWorld

> cd HelloWorld

> npm install

> node server.js
```

### Usage

This sample app is self explanatory. Just browse through the directories and files and you will get the hang of it.

Example:

After you have set-up a new oils project. 

* Go to controllers folder.
* Create a controller. e.g. test.js
* Restart server.
* Access your controller with your browser: http://localhost:8080/test

### Plugins

Check plugin folder's [README.md](https://github.com/mannyvergel/oils-js/tree/master/template/oils/plugins) for more information.

### Event Hooks

Starting v0.2.5

#### ```beforeRender```

```
app.on('beforeRender', function(view, options, callback) {
	//called before res.render(...);
})
```

#### ```initializeServer```

```
app.on('initializeServer', function() {
	var app = this;
	var server = app.server; //express server
	...
})
```

More hooks to follow.

### Authentication

Authentication is implemented as a plugin: [oils-auth-local](http://github.com/mannyvergel/oils-auth-local). Just place it in your project's plugin folder. i.e. under ```/oils/plugins/oils-auth-local```.


### Contact

If you have questions, feel free to drop me an email: manny@mvergel.com

### License

The MIT License (MIT)

Copyright (c) 2014 Manny

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
