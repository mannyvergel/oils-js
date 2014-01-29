module.exports = function(app) {
	var conf = include(app.constants.CONF_FILE);
	app.conf = conf;
}