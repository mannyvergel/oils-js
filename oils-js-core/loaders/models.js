var mongoose = require('mongoose');
var fileUtils = require('../utils/fileUtils');
var pluginUtils = require('../utils/pluginUtils');
var Schema = mongoose.Schema;
var stringUtils = require('../utils/stringUtils');
var constants = require('../constants.js');
module.exports = function(app, callback) {
	app.models = new Object();
	getModelsFromDir(app.constants.MODELS_DIR, app, function(err, model, opts) {
		var name = opts.name;
		app.models[name] = model;
	});
}

function hasConnection(connections) {
	for (var i in connections) {
		return true;
	}

	return false;
}


function getModelsFromDir(dir, app, callback) {
	//do not load models if there's DB
	
	if (!hasConnection(app.connections)) {
		if (app.isDebug) {
			console.log('No connections found. Ignoring models.');
		}
		return;
	}

	if (app.isDebug) {
		console.log("Scanning models in %s", dir);
	}
	var models = [];

  fileUtils.recurseDir(dir, function(err, opts) {
    if (!opts.isDirectory() && stringUtils.endsWith(opts.file, '.js')) {

      var absPath = opts.absolutePath;
      var modelJs = require(absPath);
      var conn;

      if (modelJs.connection) {
        conn = app.connections.mainDb;
      } else {
        if (connections.mainDb) {
          conn = app.connections.mainDb; 
        } else {
          for (var i in app.connections) {
          //get the first connection
          conn = app.connections[i];
          break;
          }
        }

      }

      var schema = new Schema(modelJs.schema);
      if (modelJs.initSchema) {
        modelJs.initSchema(schema);
      }
      
      var model = conn.model(opts.name, schema);
      pluginUtils.execDoAfterLoadModel(app, model);
      if (app.isDebug) {
        console.log("[model] " + opts.name)
      }

      if (callback) {
        callback(null, model, opts);
      }
    }
  })

  return models;

}