var routeUtils = require('./routeUtils.js');

//deprecated, use event hooks
/*exports.execDoAfterLoadModel = function(app, model) {
  loopPlugins(app, function(plugin) {

    if (plugin.doAfterLoadModel) {
      plugin.doAfterLoadModel(app, model);
    }
  })
  
}*/


exports.execRoutes = function(app) {
  
  loopPlugins(app, function(plugin) {

    var routes = plugin.routes;
    if (routes) {
      for (var routeKey in routes) {
        var route = routes[routeKey];
        routeUtils.applyRoute(app, routeKey, route);
      }
    }
  })
}

//deprecated, use app.on('initializeServer')
/*
exports.execInitializeServer = function(app, model) {
  loopPlugins(app, function(plugin) {

    if (plugin.initializeServer) {
      plugin.initializeServer(app);
    }
  })
  
}
*/


function loopPlugins(app, callback) {
  if (!app.plugins) {
    return;
  }

  if (!app.pluginsSorted) {
    //dependencies
    app.pluginsSorted = getPluginsSortedByDependencies(app);
  }
  for (var i in app.pluginsSorted) {
    var plugin = app.pluginsSorted[i];
    callback(plugin);
  }
}


function getPluginsSortedByDependencies(app) {
  var array = [];
  for (var i in app.plugins) {
    var plugin = app.plugins[i];
    handlePluginDependencies(plugin.conf.name, app, array);
  }

  return array;
}


function handlePluginDependencies(pluginName, app, array) {
  var plugin = getAppPlugin(pluginName, app);
  for (var i in plugin.conf.oils.depedencies) {
    //i is they plugin name
    //similar to package.json, version support is not implemented this time

    handlePluginDependencies(i, app, array);
  } 

  addPlugin(plugin, array, app);
}

function addPlugin(plugin, array, app) {
  if (array.indexOf(plugin) == -1) {
    array.push(plugin);
    if (app.isDebug) {
      console.log('[sorted plugin][%d] %s',  (array.length -1), plugin.conf.name)
    }
  }
}

function getAppPlugin(pluginName, app) {
  var plugin = app.plugins[pluginName];
  if (!plugin) {
    throw new Error('Plugin not found ' + pluginName);
  }

  return plugin;
}