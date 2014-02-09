var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var pluginUtils = require('../utils/pluginUtils');

module.exports = function(app) {

  app.modelCache = new Object();

  app.includeModel = function(workingPath) {


    var modelJs = null;
    try {
      modelJs = include(workingPath);
    } catch (e) {
      throw new Error('Error loading model ' + workingPath + '. Probably invalid model format ::: ' + e.message);
    }
   
    var modelName = modelJs.name;
    if (!modelName) {
      modelName = path.basename(workingPath, '.js');
    }

    if (app.modelCache[modelName]) {
      return app.modelCache[modelName];
    }



    var conn;

    if (modelJs.connection) {
      conn = app.connections.mainDb;
    } else {
    if (app.connections.mainDb) {
      conn = app.connections.mainDb; 
    } else {
      for (var i in app.connections) {
          //get the first connection
          conn = app.connections[i];
          break;
        }
      }

    }
    if (!modelJs.schema) {
      throw new Error(modelName + '.schema not found.');
    }

    var schema = new Schema(modelJs.schema, modelJs.options);
    if (modelJs.initSchema) {
      modelJs.initSchema(schema);
    }

    var model = conn.model(modelName, schema);
    
    if (app.isDebug) {
      console.log("Loaded model for the first time: " + modelName)
    }

    app.modelCache[modelName] = model;        
    return model;
  }

  global.includeModel = app.includeModel;

  app.models = function(modelName) {

    if (!app.modelCache[modelName]) {
      var workingPath = app.constants.MODELS_DIR + '/' + modelName;
      app.modelCache[modelName] = includeModel(workingPath);
    }
    return app.modelCache[modelName];

  }


  global.models = app.models;
}