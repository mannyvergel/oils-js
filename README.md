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

The framework by default integrates nunjucks templating for the front end and mongodb for the backend.

### Quick Start

This assumes you already have Node JS v0.10.x (or higher) installed.

```
> npm install oils -g

> oils new HelloWorld --template zurb5

```

template is optional...

```
> cd HelloWorld

> npm install

> node server.js
```


#### Latest Release(s)

Version 1.0.6 ([Download](https://github.com/mannyvergel/oils-js/archive/v1.0.6.zip))
* Revamp of code, more structured
* Not backwards compatible

Version 0.4.5 ([Download](https://github.com/mannyvergel/oils-js/archive/v0.4.5.zip))
* Bug fix for model inclusion


#### Directory Structure

    |-- conf                  //config files and routes
    |-- web          
    |   |-- public            //assets like css, js, images
    |   |-- src               
    |       |-- controllers   //controllers    
    |       |-- models        //models for mongoose db 
    |       |-- views         //uses swig for templating 


You can see the README.md's of each directory above for more information.

#### Noteworthy Helper Functions

#### ```web```

The global variable ```web``` can be used almost anywhere to access the instance of oils. ```web.app``` is the instance of express server.

##### ```web.include(path)```

You can use ```include``` function which is basically like ```require``` except that it's based on the the project directory if the path starts with '/'.

E.g. Consider the ff structure:

    |-- web    
    |   |-- src           
    |       |-- controllers  
    |           |--folder
    |              |--subfolder
    |                 |--controller1.js    
    |-- lib
    |   |--folder
    |      |--subfolder
    |         |--lib1.js  

If you are in controller1.js and you want to import lib1.js

Instead of using:

````
var lib1 = require('../../../../../lib/folder/subfolder/lib1.js');
```

Use 

```
var lib1 = web.include('/lib/folder/subfolder/lib1.js');
````

##### ```web.includeModel(path)```

loads a model based on the path and returns a Mongoose Model. The path also behaves like ```include``` i.e. if it starts with '/' it will base the path on the project's directory.

e.g.
```
var Book = web.includeModel('/web/models/Book.js');
```

##### ```web.models('modelName')```

A convenience function for ```includeModel```

e.g.
```
var Book = web.models('Book');
```

### Components
Oils js uses Mongoose for ORM, Mongo DB for the database and Nunjucks for templating. Only Mongo DB is supported for now but this may change in the future depending on the needs.

For the default templating, Nunjucks has been chosen because it doesn't mess much with the html syntax. You can override this by passing an express templateEngine e.g. var web = new Web({templateEngine: myTemplateEngin}).

### Features

The follow are motivations behind creating Oils Js Framework:

+ Intuitive MVC approach
+ Automatic routing of controllers
+ Organized folder structure
+ Organized importing of js files using "include"
+ Automatic creation of models and controllers
+ Support for multiple database connections
+ Uninterrupted Mongo DB Connection (auto reconnect)
+ Uninterrupted server when there's an exception
+ Graceful error handling per request
+ Plugin support
+ Event hooks

Future Features:

+ Scaffolding


### Usage

This sample app is self explanatory. Just browse through the directories and files and you will get the hang of it.

Example:

After you have set-up a new oils project. 

* Go to controllers folder.
* Create a controller. e.g. test.js
* Restart server.
* Access your controller with your browser: http://localhost:8080/test

### Plugin Support

Basically there are two steps to make a plugin work:

1. Install the required module in node_modules directory via npm install or package.js,

2. and declare it /conf/conf.js (see /conf/conf.js for more information).


###Creating your own plugin

Creating your own plugin is easy; you just hook onto events of oils. See the (oils-plugin-basic)[https://github.com/mannyvergel/oils-plugin-basic] for more information.

Plugins:
(Authentication (oils-plugin-auth))[https://github.com/mannyvergel/oils-plugin-auth]


### Event Hooks

Starting v0.2.5

#### ```beforeRender```

```
web.on('beforeRender', function(view, options, callback, req, res) {
	//called before res.render(...);
})
```

#### ```initServer```

```
web.on('initServer', function() {
	var web = this; //this is an instance of web
	...
})
```

More hooks to follow.

### Authentication

Authentication is implemented as a plugin: [oils-auth-local](http://github.com/mannyvergel/oils-auth-local). Just place it in your project's plugin folder. i.e. under ```/conf/plugins/oils-auth-local```.


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
