oilsjs
======

### Oils JS

Oils is a framework built on top of Express framework. It's very flexible and very simple to use, you'll love it! 

It is primarily used to create Openshift Node JS Applications. You can also use this for other projects as the variable dependencies are just very few and are all in the configuration file.

It will automatically read models and controllers. Also features automatic routing for created controllers.

Directory Structure:

    |-- controllers
    |-- models
    |-- views
    |-- public
    |-- lib

You can see the README.md's of each directory above for more information.

### Set-Up

For OpenShift apps, after creating your node js + mongodb application, clone the project to your local and go to that directory.

Example:

```
npm install oils -g
```

```
oils new HelloWorld
```

```
cd HelloWorld
```

```
npm install
```

```
node server.js
```

or you can just simply Download the zip version of this project and copy-paste it to your node js application.

### Usage

This sample app is self explanatory. Just browse through the directories and files and you will get the hang of it.

It uses Mongoose for ORM. Mongo DB for the database. Swig for templating.

### Contact

If you have questions, feel free to drop me an email: manny@mvergel.com

### License

MIT
