var objectUtils = require('./objectUtils');
var domain = require('domain');
//var web = global.web;
exports.applyRoute = function(web, route, obj) {
  
  if (obj.route) {
    //override autoroute with controller's defined route
    route = obj.route;
  }
 
  if (objectUtils.isObject(obj)) {
    applyVerbs(web,route, obj, ["get", "put", "post", "delete", "options", "all"]);
  } else if (objectUtils.isFunction(obj) || objectUtils.isArray(obj)) {
    
    if (console.isDebug) {
      console.debug('[route] ALL ' + route);
    }

    handleRequest(web, 'all', route, obj);
    
  } else {
    throw new Error('Unsupported route object.');
  }
  
}

function applyVerbs(web,route, obj, verbs) {

  for (var i in verbs) {
    var verb = verbs[i];
    if (obj[verb]) {
      
      if (obj.isRegexp) {
        if (console.isDebug) {
          console.debug('[route regex] %s %s', verb, route);
        }
        var flags = route.replace(/.*\/([gimy]*)$/, '$1');
        var pattern = route.replace(new RegExp('^/(.*?)/'+flags+'$'), '$1');
        route = new RegExp(pattern, flags);
        //var match = route.match(new RegExp('/^\/(.*?)\/([gim]*)$/'));
        //route = new RegExp(route);
        
      } else {
        if (console.isDebug) {
          console.debug('[route] %s %s', verb, route);
        } 
      }

      handleRequest(web, verb, route, obj[verb], obj);
    }
  }
}

function handleRequest(web, verb, route, obj, controller) {
  var app = web.app;
  var objArray = obj;
  if (!objectUtils.isArray(objArray)) {
    objArray = [objArray];
  }

  var objArrayToApply = [];
  for (var i in objArray) {
    var singleObj = objArray[i];
    objArrayToApply.push(wrapObjToControllerDomain(web, verb, route, singleObj, controller));
  }

  app.route(route)[verb](objArrayToApply);
  
}

function wrapObjToControllerDomain(web, verb, route, obj, controller) {
  var app = web.app;
  return function(req, res, next) {
    var reqd = domain.create();
    reqd.add(req);
    reqd.add(res);
    reqd.on('error', function(er) {
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

  }
}

function showError(req, res, er, app) {
  try {
    res.status(500);
    console.error('Route error at ' + req.url, er);
    if (web.conf.handle500) {
      web.conf.handle500(er, req, res);
    } else {
      if (console.isDebug) {
        res.write(er.stack);
      } else {
        //show to end users
        res.write('An unexpected error has occurred.');
      }
      res.end();
    }

  } catch (er) {
    console.error('Error sending 500', er, req.url);
  }
}