PLUGINS FOLDER
==================

Simple plugin system. This is a WIP. Currently supported is routes and doAfterLoadModel.

Each folder here will be read as a plugin of the system.

Example plugin:

    |-- plugins          
    |   |-- basic-plugin      //folder name is the plugin name    
    |       |-- conf.js       //plugin configuration  
    |       |-- index.js      //can be index.js, can have package.json. Same as node js.   


```
//conf.js
var conf = {
  enabled: true
}

module.exports = conf;
```

```
//index.js
module.exports = {

  doAfterLoadModel: function(app, model) {
    ...
  },

  routes: {
    '/hello-plugin' :  function(req, res) {
        res.end('HELLO PLUGIN!');
    }
  }
}
```