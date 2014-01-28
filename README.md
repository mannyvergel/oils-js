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


Directory Structure:

    |-- conf          //configuration
    |-- controllers   //controllers
    |-- lib           //custom modules
    |-- models        //models
    |-- public        //assets like css, js, images
    |-- views         //uses swig

You can see the README.md's of each directory above for more information.

### Components
Oils js uses Mongoose for ORM, Mongo DB for the database and Swig for templating. Only Mongo DB is supported for now but this may change in the future depending on the needs.

For the default templating, Swig has been chosen because it doesn't mess much with the html syntax. You can override this by setting the attributes of app.server before calling app.start(), however, do this at your own risk as future features may not support custom template engines (e.g. scaffolding).

### Features

The follow are motivations behind creating Oils Js Framework:

+ Intuitive MVC approach
+ Automatic routing of controllers
+ Organized folder structure
+ Automatic creation of models and controllers
+ Uninterrupted Mongo DB Connection (auto reconnect)
+ Support for multiple database connections
+ Uninterrupted server when there's an exception

Future Features:

+ Scaffolding
+ Helper Functions
+ Support for SQL DB

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

Go to controllers folder
Create a controller. e.g. test.js
Restart server
Access your controller with your browser: http://localhost:8080/test

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
