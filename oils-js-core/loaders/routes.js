
var pluginUtils = require('../utils/pluginUtils');
var routeUtils = require('../utils/routeUtils');
module.exports = function(app) {
	processCustomRoutes(app);

  pluginUtils.execRoutes(app);

  require('./controllers')(app);
};

function processCustomRoutes(app) {
	var customRoutes = include(app.constants.ROUTES_FILE);
	var server = app.server;
	for (var routeKey in customRoutes) {
		var customRoute = customRoutes[routeKey];

		routeUtils.applyRoute(app, routeKey, customRoute);
	}
}


