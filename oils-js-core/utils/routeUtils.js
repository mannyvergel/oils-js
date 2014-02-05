var objectUtils = require('./objectUtils');
exports.applyRoute = function(app, route, obj) {
  if (obj.route) {
    //override autoroute with controller's defined route
    route = obj.route;
  }
  var server = app.server;
  if (objectUtils.isObject(obj)) {
    applyVerbs(app, route, obj, ["get", "put", "post", "delete", "options", "all"]);
  } else if (objectUtils.isFunction(obj) || objectUtils.isArray(obj)) {
    
    if (app.isDebug) {
      console.log('[route] ALL ' + route);
    }
    server.all(route, obj);
    
  } else {
    throw new Error('Unsupported route object.');
  }
  
}

function applyVerbs(app, route, obj, verbs) {
  var server = app.server;
  for (var i in verbs) {
    var verb = verbs[i];
    if (obj[verb]) {
      
      if (obj.isRegexp) {
        if (app.isDebug) {
          console.log('[route regex] %s %s', verb, route);
        }
        var flags = route.replace(/.*\/([gimy]*)$/, '$1');
        var pattern = route.replace(new RegExp('^/(.*?)/'+flags+'$'), '$1');
        route = new RegExp(pattern, flags);
        //var match = route.match(new RegExp('/^\/(.*?)\/([gim]*)$/'));
        //route = new RegExp(route);
        
      } else {
        if (app.isDebug) {
          console.log('[route] %s %s', verb, route);
        } 
      }
       
      server[verb](route, obj[verb]);
    }
  }
}