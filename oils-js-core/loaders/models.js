var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var pluginUtils = require('../utils/pluginUtils');
var extend = require('node.extend');

module.exports = function(app) {

  app.modelCache = new Object();

  app.includeModelObj = function(modelJs) {
    var modelName = modelJs.name;
    
    if (!modelJs.schema) {
      throw new Error(modelName + '.schema not found.');
    }

    var collectionName = undefined;
    if (modelJs.parentModel) {
      
      var parentModel = includeModel(modelJs.parentModel);
      var parentModelJs = parentModel.getModelDictionary();
      collectionName = parentModel.collection.name;

      modelJs.schema = extend(parentModelJs.schema, modelJs.schema);
      
      var origSchema = modelJs.initSchema;
      modelJs.initSchema = [];
      if (origSchema) {
        modelJs.initSchema.push(origSchema);
      }

      if (parentModelJs.initSchema) {
        modelJs.initSchema.push(parentModelJs.initSchema);
      }

      modelJs.options = extend(parentModel.options || {}, modelJs.options);

      if (app.isDebug) {
        console.debug('Model %s has a parent %s', modelName, modelJs.parentModel);
      }
      //modelJs = extend(true, parentModelJs, modelJs);
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
    



    var schema = new Schema(modelJs.schema, modelJs.options);
    if (modelJs.initSchema) {
      if (modelJs.initSchema instanceof Array) {
        for (var i in modelJs.initSchema) {
          var mySchema = modelJs.initSchema[i];
          // if (app.isDebug) {
          //   console.debug('[%s] Executing array initSchema %s', modelJs.name ,mySchema);
          // }
          mySchema(schema);
        }
      } else {
        //console.debug('[%s] Executing normal initSchema %s', modelJs.name ,modelJs.initSchema);
        modelJs.initSchema(schema);
      }
      
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

    if (!modelJs.name) {
      if (!workingPath) {
        throw new Error('Model name must be defined.');
      }
      modelJs.name = path.basename(workingPath, '.js');
    }

    if (app.modelCache[modelJs.name]) {
      if (app.isDebug) {
        console.debug("Loading model %s from cache", modelJs.name)
      }
      return app.modelCache[modelJs.name];
    }
   
    return app.includeModelObj(modelJs);
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