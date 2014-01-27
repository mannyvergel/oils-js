var fileUtils = require('../utils/fileUtils');
var customRoutes = include('/conf/routes.js');
module.exports = function(app) {
	customRoutes(app);

	//automatically route controllers
	getControllerRoutes(app, '/controllers');
};

function getControllerRoutes(app, dir) {

	fileUtils.recurseJs(dir, function(err, opts) {
		if (!opts.isDirectory()) {
			var file = opts.file;
			var subfolder = opts.subfolder;
			if (oils.isDebug) {
				console.log(opts.absolutePath + '[file]');
			}
			var subPath = subfolder + '/' + file;
			var absPath = opts.absolutePath;
			var controller = require(absPath);
			var subPathWithoutExt;
			if (file == 'index.js') {
			 	subPathWithoutExt = subPath.slice(0, -8);
			} else {
				subPathWithoutExt = subPath.slice(0, -3);
			}
			if (oils.isDebug) {
				console.log(subPathWithoutExt + ' :: ' + subPath);
			}
			if (controller.get) {
				app.get(subPathWithoutExt, controller.get);
			}

			if (controller.post) {	
				app.post(subPathWithoutExt, controller.post);
			}
		}
	})

}
