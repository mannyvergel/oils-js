var fileUtils = require('../utils/fileUtils');
var pluginUtils = require('../utils/pluginUtils');
var routeUtils = require('../utils/routeUtils');
var stringUtils = require('../utils/stringUtils');
module.exports = function(app) {
	processCustomRoutes(app);

  pluginUtils.execRoutes(app);

	//automatically route controllers
	setControllerRoutes(app, app.constants.CONTROLLERS_DIR);
};

function processCustomRoutes(app) {
	var customRoutes = include(app.constants.ROUTES_FILE);
	var server = app.server;
	for (var routeKey in customRoutes) {
		var customRoute = customRoutes[routeKey];

		routeUtils.applyRoute(app, routeKey, customRoute);
	}
}

function setControllerRoutes(app, dir) {
  if (app.isDebug) {
    console.log("Scanning controllers in %s", dir);
  }
	fileUtils.recurseDir(dir, function(err, opts) {
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
					routeUtils.applyRoute(app, subPathWithoutExt, controller);

					if (opts.subfolder) {
						//for non root index.js apply no '/'
						//e.g. http://localhost/admin/ and http://localhost/admi 
						subPathWithoutExt = subPath.slice(0, -9);
						routeUtils.applyRoute(app, subPathWithoutExt, controller);
					}
					
				} else {
					var subPathWithoutExt = subPath.slice(0, -3);
					routeUtils.applyRoute(app, subPathWithoutExt, controller);
				}
				
				
			}

			
		}
	})

}

