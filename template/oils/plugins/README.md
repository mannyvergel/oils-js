PLUGINS FOLDER
==================

Simple plugin system. This is a WIP. Currently supported is routes and initializeServer.

Each folder here will be read as a plugin of the system.

You can check [oils-auth-local](https://github.com/mannyvergel/oils-auth-local) plugin for a concrete example. 

Sample plugin:

    |-- plugins          
    |   |-- basic-plugin      //folder name is the plugin name    
    |       |-- package.js    //plugin configuration  
    |       |-- index.js      //can be index.js, can have package.json. Same as node js.   


```
//package.js
...
"oils" : {
    "enabled": true, //required
    //custom configuration variables
  }
...
```

```
//index.js
module.exports = function(pkg, app) {
  var self = this;
  

  self.initializeServer = function() {
    //custom server initialization
  };

  self.routes = {
    '/hello-plugin' :  function(req, res) {
        res.end('HELLO PLUGIN!');
    }
  }


}
```
