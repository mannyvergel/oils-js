var fileUtils = require('../utils/fileUtils');
var customRoutes = include('/conf/routes.js');
var stringUtils = require('../utils/stringUtils');
module.exports = function(app) {
	customRoutes(app);

	//automatically route controllers
	setControllerRoutes(app, '/controllers');
};

function setControllerRoutes(app, dir) {

	fileUtils.recurseJs(dir, function(err, opts) {
		if (!opts.isDirectory() && stringUtils.endsWith(opts.file, '.js')) {
			var file = opts.file;
			var subfolder = opts.subfolder;
			if (oils.isDebug) {
				console.log(opts.absolutePath + '[file]');
			}
			var subPath = subfolder + '/' + file;
			var absPath = opts.absolutePath;
			var controller = require(absPath);
		
			var server = app.server;

			if (controller.autoRoute !== false) {
				if (file == 'index.js') {
				 	var subPathWithoutExt = subPath.slice(0, -8);
					applyRoute(server, subPathWithoutExt, controller);

					if (opts.subfolder) {
						//for non root index.js apply no '/'
						//e.g. http://localhost/admin/ and http://localhost/admi 
						subPathWithoutExt = subPath.slice(0, -9);
						applyRoute(server, subPathWithoutExt, controller);
					}
					
				} else {
					var subPathWithoutExt = subPath.slice(0, -3);
					applyRoute(server, subPathWithoutExt, controller);
				}
				
				
			}

			
		}
	})

}

function applyRoute(server, route, controller) {
	if (controller.get) {
		if (oils.isDebug) {
			console.log('[route] GET ' + route);
		}
		server.get(route, controller.get);
	}

	if (controller.post) {	
		if (oils.isDebug) {
			console.log('[route] POST ' + route);
		}
		post(route, controller.post);
	}
}