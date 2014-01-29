var fileUtils = require('../utils/fileUtils');
var stringUtils = require('../utils/stringUtils');
module.exports = function(app) {
	processCustomRoutes(app);

	//automatically route controllers
	setControllerRoutes(app, app.constants.CONTROLLERS_DIR);
};

function processCustomRoutes(app) {
	var customRoutes = include(app.constants.ROUTES_FILE);
	var server = app.server;
	for (var routeKey in customRoutes) {
		var customRoute = customRoutes[i];

		applyRoute(app, routeKey, customRoute);
	}
}

function setControllerRoutes(app, dir) {

	fileUtils.recurseJs(dir, function(err, opts) {
		if (!opts.isDirectory() && stringUtils.endsWith(opts.file, '.js')) {
			var file = opts.file;
			var subfolder = opts.subfolder;
			if (app.isDebug) {
				console.log(opts.absolutePath + '[file]');
			}
			var subPath = subfolder + '/' + file;
			var absPath = opts.absolutePath;
			var controller = require(absPath);
		
			if (controller.autoRoute !== false) {
				if (file == 'index.js') {
				 	var subPathWithoutExt = subPath.slice(0, -8);
					applyRoute(app, subPathWithoutExt, controller);

					if (opts.subfolder) {
						//for non root index.js apply no '/'
						//e.g. http://localhost/admin/ and http://localhost/admi 
						subPathWithoutExt = subPath.slice(0, -9);
						applyRoute(app, subPathWithoutExt, controller);
					}
					
				} else {
					var subPathWithoutExt = subPath.slice(0, -3);
					applyRoute(app, subPathWithoutExt, controller);
				}
				
				
			}

			
		}
	})

}

function applyRoute(app, route, obj) {

	var server = app.server;
	if (obj instanceof Function) {
		
		if (app.isDebug) {
			console.log('[route] ALL ' + route);
		}
		server.all(route, obj);
		
	} else {
		if (obj.get) {
			if (oils.isDebug) {
				console.log('[route] GET ' + route);
			}
			server.get(route, obj.get);
		}

		if (obj.post) {	
			if (oils.isDebug) {
				console.log('[route] POST ' + route);
			}
			post(route, obj.post);
		}
	}
	
}