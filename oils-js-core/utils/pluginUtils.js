var routeUtils = require('./routeUtils.js');
exports.execDoAfterLoadModel = function(app, model) {
  loopPlugins(app, function(plugin) {

    if (plugin.doAfterLoadModel) {
      plugin.doAfterLoadModel(app, model);
    }
  })
  
}


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



function loopPlugins(app, callback) {
  for (var i in app.plugins) {
    var plugin = app.plugins[i];
    callback(plugin);
  }
}