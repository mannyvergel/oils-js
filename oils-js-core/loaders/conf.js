module.exports = function(app) {
	var conf = include('/conf/conf.js');
	app.conf = conf;
	//convenience
	app.isDebug = conf.isDebug;
}