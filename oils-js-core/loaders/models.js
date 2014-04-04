var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var pluginUtils = require('../utils/pluginUtils');
var extend = require('node.extend');

module.exports = function(app) {

  app.modelCache = new Object();

  app.includeModelObj = function(modelJs, workingPath) {
    var modelName = modelJs.name;
    if (!modelName) {
      if (!workingPath) {
        throw new Error('Model name must be defined.');
      }
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

    var collectionName = undefined;
    if (modelJs.parentModel) {
      
      var parentModel = includeModel(modelJs.parentModel);
      var parentModelJs = parentModel.getModelDictionary();
      collectionName = parentModel.collection.name;

      modelJs.schema = extend(parentModelJs.schema, modelJs.schema);
      if (!modelJs.initSchema) {
        modelJs.initSchema = parentModelJs.initSchema;
      }
      modelJs.options = extend(parentModel.options || {}, modelJs.options);

      if (app.isDebug) {
        console.debug('Model %s has a parent %s', modelName, modelJs.parentModel);
      }
      //modelJs = extend(true, parentModelJs, modelJs);
    }

    var schema = new Schema(modelJs.schema, modelJs.options);
    if (modelJs.initSchema) {
      modelJs.initSchema(schema);
    }

    var model = conn.model(modelName, schema, collectionName);
    if (app.isDebug) {
      console.debug("Loaded model for the first time: " + modelName)
    }

    app.modelCache[modelName] = model;
    model.getModelDictionary = function() {
      return modelJs;
    }        
    return model;
  }

  app.includeModel = function(workingPath) {


    var modelJs = null;
    try {
      modelJs = include(workingPath);
    } catch (e) {
      throw new Error('Error loading model ' + workingPath + '. Probably invalid model format ::: ' + e.message);
    }
   
    return app.includeModelObj(modelJs, workingPath);
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