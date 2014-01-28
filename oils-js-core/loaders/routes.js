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
			var subPathWithoutExt;
			var server = app.server;

			if (controller.autoRoute !== false) {
				if (file == 'index.js') {
				 	subPathWithoutExt = subPath.slice(0, -8);
				} else {
					subPathWithoutExt = subPath.slice(0, -3);
				}
				if (oils.isDebug) {
					console.log(subPathWithoutExt + ' :: ' + subPath);
				}
				if (controller.get) {
					server.get(subPathWithoutExt, controller.get);
				}

				if (controller.post) {	
					post(subPathWithoutExt, controller.post);
				}
			}

			
		}
	})

}
