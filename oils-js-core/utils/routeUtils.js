var objectUtils = require('./objectUtils');
var domain = require('domain');
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
      console.debug('[route] ALL ' + route);
    }
    //server.all(route, obj);
    handleRequest(app, 'all', route, obj);
    
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
          console.debug('[route regex] %s %s', verb, route);
        }
        var flags = route.replace(/.*\/([gimy]*)$/, '$1');
        var pattern = route.replace(new RegExp('^/(.*?)/'+flags+'$'), '$1');
        route = new RegExp(pattern, flags);
        //var match = route.match(new RegExp('/^\/(.*?)\/([gim]*)$/'));
        //route = new RegExp(route);
        
      } else {
        if (app.isDebug) {
          console.debug('[route] %s %s', verb, route);
        } 
      }

      handleRequest(app, verb, route, obj[verb], obj);
    }
  }
}

function handleRequest(app, verb, route, obj, controller) {
  var server = app.server;
  server[verb](route, function(req, res, next) {
    var reqd = domain.create();
    reqd.add(req);
    reqd.add(res);
    reqd.on('error', function(er) {
      console.error('Error', er, req.url);
      if (controller && controller.onError) {
        try {
          controller.onError(req, res, er, app);
        } catch (e) {
          showError(req, res, e, app);
        }
        
      } else {
        showError(req, res, er, app);
      }
      
    });

    reqd.run(function() {
      try {
        obj(req, res, next);
      } catch(er) {
        if (controller && controller.onError) {
          try {
            controller.onError(req, res, er, app);
          } catch (e) {
            showError(req, res, e, app);
          }
          
        } else {
          showError(req, res, er, app);
        } 
      }
      
    }) 

  });
  
}

function showError(req, res, er, app) {
  try {
    res.writeHead(500);
    if (app.isDev) {
      res.write(er.stack);
    } else {
      //show to end users
      res.write('An unexpected error has occurred.');
    }
    res.end();
  } catch (er) {
    console.error('Error sending 500', er, req.url);
  }
}