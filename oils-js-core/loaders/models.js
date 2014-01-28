var mongoose = require('mongoose');
var fileUtils = require('../utils/fileUtils');
var Schema = mongoose.Schema;
var stringUtils = require('../utils/stringUtils');

module.exports = function(app) {
	app.models = new Object();
	getModelsFromDir('/models', function(err, model, opts) {
		var name = opts.name;
		app.models[name] = model;
	});
}


function getModelsFromDir(dir, callback) {
	//do not load models if there's DB
	if (!connections) {
		return;
	}
	var models = [];
	fileUtils.recurseJs(dir, function(err, opts) {
		if (!opts.isDirectory() && stringUtils.endsWith(opts.file, '.js')) {

			var absPath = opts.absolutePath;
			var modelJs = require(absPath);
			var conn;

			if (modelJs.connection) {
				conn = connections.mainDb;
			} else {
				if (connections.mainDb) {
					conn = connections.mainDb;	
				} else {
					for (var i in connections) {
						//get the first connection
						conn = connections[i];
						break;
					}
				}
				
			}

			var schema = new Schema(modelJs.schema);
			if (modelJs.initSchema) {
				modelJs.initSchema(schema);
			}
			var model = conn.model(opts.name, schema);

			if (callback) {
				callback(null, model, opts);
			}
		}
	})

	return models;

}