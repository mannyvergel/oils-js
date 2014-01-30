exports.applyRoute = function(app, route, obj) {
  var server = app.server;
  if (obj instanceof Function) {
    
    if (app.isDebug) {
      console.log('[route] ALL ' + route);
    }
    server.all(route, obj);
    
  } else {
    if (obj.get) {
      if (app.isDebug) {
        console.log('[route] GET ' + route);
      }
      server.get(route, obj.get);
    }

    if (obj.post) { 
      if (app.isDebug) {
        console.log('[route] POST ' + route);
      }
      server.post(route, obj.post);
    }
  }
  
}