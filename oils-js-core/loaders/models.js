var mongoose = require('mongoose');
var fileUtils = require('../utils/fileUtils');
var Schema = mongoose.Schema;

module.exports = function(app) {
	app.models = new Object();
	getModelsFromDir('/models', function(err, model, opts) {
		var name = opts.name;
		app.models[name] = model;
	});
}


function getModelsFromDir(dir, callback) {
	var models = [];
	fileUtils.recurseJs(dir, function(err, opts) {
		if (!opts.isDirectory()) {

			var absPath = opts.absolutePath;
			var modelJs = require(absPath);
			var conn = connections.mainDb;

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