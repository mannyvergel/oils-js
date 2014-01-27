module.exports = function(app) {
	var conf = include('/conf/conf.js');
	app.conf = conf;
	app.isDebug = conf.debug;
}