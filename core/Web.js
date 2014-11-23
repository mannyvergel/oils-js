var Obj = require('./Obj.js');
var extend = require('node.extend');
var express = require('express');
var domain = require('domain');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var log4js = require('log4js');
var flash = require('connect-flash');
var routeUtils = require('./utils/routeUtils');
log4js.replaceConsole();

var constants = {
  VIEWS_DIR: '/web/src/views',
  CONTROLLERS_DIR: '/web/src/controllers',
  MODELS_DIR: '/web/src/models',
  PUBLIC_DIR: '/web/public',
  //PLUGINS_DIR: '/conf/plugins',
  CONFIG_PATH: '/conf/conf.js',
  ROUTES_FILE: '/conf/routes.js'
}

var defaultConf = {
  baseDir: process.cwd(),
  viewsDir: constants.VIEWS_DIR,
  controllersDir: constants.CONTROLLERS_DIR,
  modelsDir: constants.MODELS_DIR,
  publicDir: constants.PUBLIC_DIR,
  pluginsDir: constants.PLUGINS_DIR,
  customConfigFile: constants.CONFIG_PATH,
  routesFile: constants.ROUTES_FILE,
  port: 8080,
  ipAddress: '0.0.0.0',
  isDebug: false,
  connections: {
    //only mongoose connections are support for now
    //you can specify multiple connections and specify the connection in your model.
    //if you don't need a db, you can remove/comment out mainDb
    mainDb : {
      url: (process.env.OPENSHIFT_MONGODB_DB_URL + process.env.OPENSHIFT_APP_NAME) || 'mongodb://localhost/test'
    }
  }
}
/**
Oils web app
*/
var Web = Obj.extend('Web', {
  init: function(conf){
    global.web = this;
    this.constants = constants;
    //load custom config file
    this.conf = defaultConf;
    this.conf = extend(this.conf, conf);
    var customConfigFile = this.include(this.conf.customConfigFile);
    for (var i in conf) {
      delete customConfigFile[i];
    }
    this.conf = extend(this.conf, customConfigFile);

    console.isDebug = this.conf.isDebug;
    if (console.isDebug) {
      console.debug('Oils config: ' + JSON.stringify(this.conf, null, 2));
    }
    this.app = express();
    this.events = {};
    this.modelCache = new Object();
    this.plugins = [];
  },
  mongoose: mongoose,
  utils: require('./utils/oilsUtils.js'),
  fileUtils: require('./utils/fileUtils.js'),

  //web.Plugin.extend..
  Plugin: require('./Plugin.js'),

  // EVENTS -----------
  on: function(eventStr, callback) {
    if (!this.events[eventStr]) {
      this.events[eventStr] = [];
    }

    this.events[eventStr].push(callback);
  },

  callEvent: function(eventStr, argsArray){
    var myEvents = this.events[eventStr];
    for (var i in myEvents) {
      var myEvent = myEvents[i];
      myEvent.apply(this, argsArray);
    }
  },
  // EVENTS end -------

  include: function(file, secondFileFallback) {
    //if (file && file[0] == '/') {
      return require(this.conf.baseDir + file);
    //} else {
    //  return require(file);
    //}
  },

  //MODELS ------------

  includeModelObj: function(modelJs) {
    var web = this;
    var modelName = modelJs.name;
    
    if (!modelJs.schema) {
      throw new Error(modelName + '.schema not found.');
    }

    var collectionName = undefined;
    if (modelJs.parentModel) {
      
      var parentModel = web.includeModel(modelJs.parentModel);
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

      if (console.isDebug) {
        console.debug('Model %s has a parent %s', modelName, modelJs.parentModel);
      }
      //modelJs = extend(true, parentModelJs, modelJs);
    }

    var conn;

    if (modelJs.connection) {
      conn = this.connections[modelJs.connection];
    } else if (web.connections.mainDb) {
      conn = web.connections.mainDb; 
    } else {
    for (var i in this.connections) {
        //get the first connection
        conn = this.connections[i];
        break;
      }
    }

    if (!conn) {
      console.warn('No defined DB. Check your configuration.');
      return;
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
    if (console.isDebug) {
      console.debug("Loaded model for the first time: " + modelName)
    }

    web.modelCache[modelName] = model;
    model.getModelDictionary = function() {
      return modelJs;
    }        
    return model;
  },

  includeModel: function(workingPath) {

    var web = this;
    var modelJs = null;
    try {
      modelJs = web.include(workingPath);
    } catch (e) {
      throw new Error('Error loading model ' + workingPath + '. Probably invalid model format ::: ' + e.message);
    }

    if (!modelJs.name) {
      if (!workingPath) {
        throw new Error('Model name must be defined.');
      }
      modelJs.name = path.basename(workingPath, '.js');
    }

    if (web.modelCache[modelJs.name]) {
      if (console.isDebug) {
        console.debug("Loading model %s from cache", modelJs.name)
      }
      return web.modelCache[modelJs.name];
    }
   
    return web.includeModelObj(modelJs);
  },

  models: function(modelName) {

    if (!this.modelCache[modelName]) {
      var workingPath = this.conf.modelsDir + '/' + modelName;
      this.modelCache[modelName] = this.includeModel(workingPath);
    }
    return this.modelCache[modelName];

  },

  //END MODELS --------


  addPlugin: function(plugin) {
    this.plugins[plugin.id] = plugin;
  },

  _getPluginFunction: function(plugin) {
    return function(next) {
      plugin.load(plugin.conf, web, next);

    }
  },

  loadPlugins: function(cb) {
    var pluginFunctions = [];
    for (var i in this.plugins) {
      var plugin = this.plugins[i];
      pluginFunctions.push(this._getPluginFunction(plugin));

    }
    require('./utils/queueLoader.js')(pluginFunctions, [], cb);
  },

  applyRoutes: function(routes) {
    for (var routeKey in routes) {
      var customRoute = routes[routeKey];
      if (console.isDebug) {
        console.debug('[conf.route] ' + routeKey);
      }
      routeUtils.applyRoute(web, routeKey, customRoute);
    }
  },

  initServer: function() {
    var app = this.app;
    var bodyParser = require('body-parser');
    var methodOverride = require('method-override');
    var cookieParser = require('cookie-parser');
    var cookieSession = require('cookie-session');

  
    var templatesPath = this.conf.baseDir + this.conf.viewsDir;

    if (this.conf.templateLoader) {
      this.templateEngine = this.conf.templateLoader(web, templatesPath);
    } else {
      this.templateEngine = require('./engines/nunjucks')(web, templatesPath);
    }
    

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
      extended: true
    }));

    
    app.use(methodOverride());
    var cookieKey = "hello oils 2014";
    app.use(cookieParser(cookieKey));
    var oneDay = 86400000;
    app.use(cookieSession({keys: [cookieKey], cookie: {maxAge: oneDay}}));
   
    app.use(require('./custom/response')());
    app.use(flash());
    require('./loaders/connections.js')(this);

    var routesFromConf = this.include(web.conf.routesFile);
    this.applyRoutes(routesFromConf);

    require('./loaders/controllers')(this);

    require('./loaders/plugins.js')(this);
    var self = this;
    this.loadPlugins(function() {
       self.callEvent('initServer');
    });

    app.use(express.static(this.conf.baseDir + this.conf.publicDir));

    app.use(function(err, req, res, next){
      // logic
      console.error("General error", err);
      res.status(500).send("This is embarrassing.");
      //TODO: tweet / email
    });
    
  },

  /**
   * Start the server (starts up the sample application).
   * @param {Web~startCallback} cb - called after server starts.
   */
  start: function(cb) {
    var serverDomain = domain.create();
    serverDomain.on('error', function(err) {
      console.error('Server domain caught an exception: ' + err);
      if (err) {
        console.error(err.stack);
      }
    });

    var web = this;
    serverDomain.run(function() {

      // Initialize the express server and routes.
      web.initServer();
      
      //  Start the app on the specific interface (and port).
      web.app.listen(web.conf.port, web.conf.ipAddress, function(err, result) {
          console.log('%s: Node server started on %s:%d ...',
                      Date(Date.now()), web.conf.ipAddress, web.conf.port);

          if (cb) {
            cb(err, result);
          }
      });
    });
  }

});

module.exports = Web;