var Obj = require('./Obj.js');
var extend = require('node.extend');
var express = require('express');
var domain = require('domain');
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var Schema = mongoose.Schema;
var log4js = require('log4js');
var flash = require('connect-flash');
var path = require('path');
var fs = require('fs');
var csrf = require('csurf');
var routeUtils = require('./utils/routeUtils');
var stringUtils = require('./utils/stringUtils.js');
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
  enableCsrfToken: true,
  secretPassphrase: 'hello oils 2017',
  port: 8080,
  ipAddress: '0.0.0.0',
  isDebug: true,
  connectionPoolSize: 5,
  connections: {
    //only mongoose connections are support for now
    //you can specify multiple connections and specify the connection in your model.
    //if you don't need a db, you can remove/comment out mainDb
    mainDb : {
      url: (process.env.OPENSHIFT_MONGODB_DB_URL + process.env.OPENSHIFT_APP_NAME) || 'mongodb://localhost/test'
    }
  },
  parserLimit: '3mb'
}

var callerId = require('caller-id')
/**
Oils web app
*/
var Web = Obj.extend('Web', {

  init: function(conf){
    //global.web = this;
    var web = this;
    web.lib = web.lib || {};
    web.lib.mongoose = mongoose;

    if (!global._web) {
      global._web = {};
    }
    conf = conf || {};

    var callerFilePath = callerId.getData().filePath;

    if (!conf.baseDir) {
      conf.baseDir = callerFilePath.substr(0, callerFilePath.indexOf('node_modules') - 1);
    }
    if (global._web[conf.baseDir]) {
      throw new Error("Web has been redefined " + conf.baseDir + " vs " + JSON.stringify(callerId.getData()));
    }

    global._web[conf.baseDir] = web;

    if (!global.hasOwnProperty('web')) {
      Object.defineProperty(global, 'web', {
        get: function() {
          if (Object.keys(global._web).length == 1) {
            return web;
          }

          for (var i in global._web) {
            if (stringUtils.startsWith(callerId.getData().filePath, i)) {
              //console.warn('Found new web! ' + i);
              return global._web[i];
            }
          }

          throw new Error("Web cache not found " + JSON.stringify(callerId.getData()));
          //return web;
        }
      })
    }
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
  utils: require('./utils/oilsUtils.js'),
  fileUtils: require('./utils/fileUtils.js'),
  stringUtils: stringUtils,

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

    var getModelConnection = function(modelJs) {
      if (modelJs.connection) {
        return modelJs.connection
      }
      
      if (modelJs.parentModel) {
        return getModelConnection(web.include(modelJs.parentModel));
      }
    }

    var modelConn = getModelConnection(modelJs);
    if (modelConn) {
      conn = this.connections[modelConn];
      if (web.conf.isDebug) {
        console.debug("Found model conn: ", modelJs.name, modelConn);
      }
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

    //removed try catch bec v6+ of node already include stack info
    modelJs = web.include(workingPath);

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
    var web = this;
    var self = this;
    var bodyParser = require('body-parser');
    var methodOverride = require('method-override');
    var cookieParser = require('cookie-parser');
    var cookieSession = require('cookie-session');

  
    var templatesPath = self.conf.baseDir + self.conf.viewsDir;

    if (self.conf.templateLoader) {
      self.templateEngine = self.conf.templateLoader(web, templatesPath);
    } else {
      self.templateEngine = require('./engines/nunjucks')(web, templatesPath);
    }
    

    app.use(bodyParser.json({limit: web.conf.parserLimit}));
    app.use(bodyParser.urlencoded({
      extended: true,
      limit: web.conf.parserLimit
    }));

    
    app.use(methodOverride());
    var cookieKey = web.conf.secretPassphrase;
    app.use(cookieParser(cookieKey));
    var oneDay = 86400000;
    app.use(cookieSession({keys: [cookieKey], cookie: {maxAge: oneDay}}));

    if (self.conf.enableCsrfToken) {
      app.use(csrf());
      app.use(function(req, res, next) {
        res.locals._csrf = req.csrfToken();
        next();
      });
    }
   
    app.use(require('./middleware/custom-response.js')());
    app.use(flash());
    require('./loaders/connections.js')(self);

    require('./loaders/plugins.js')(self);
    
    self.loadPlugins(function() {

      var confRoutes = self.conf.routes || {};
      confRoutes = extend(self.include(self.conf.routesFile), confRoutes);

      self.conf.routes = confRoutes;
      self.applyRoutes(self.conf.routes);
      require('./loaders/controllers')(self);
      self.callEvent('initServer');
    });

    app.use(express.static(self.conf.baseDir + self.conf.publicDir));

    app.use(function(err, req, res, next){
      res.status(500);
      if (web.conf.handle500) {
        web.conf.handle500(err, req, res, next);
      } else {
        res.send("This is embarrassing.");
      }
      console.error("General error", err);
    });
    
  },

  getLetsEncryptLex: function() {
    var self = this;
    if (!self.lex) {
      var defaultHttpsConf = {
        letsEncrypt: {
          prodServer: 'https://acme-v01.api.letsencrypt.org/directory',
          stagingServer: 'staging',
          email:'manny@mvergel.com',
          testing: false
        },
        port: 443,
        alwaysSecure: {
          enabled: false
        }
      }

      if (self.conf.https && self.conf.https.letsEncrypt) {
        self.conf.https.letsEncrypt = extend(defaultHttpsConf.letsEncrypt, self.conf.https.letsEncrypt);
      }
      self.conf.https = extend(defaultHttpsConf, self.conf.https || {});

      var letsEncrServer = (!self.conf.isProduction || self.conf.https.letsEncrypt.testing) ? self.conf.https.letsEncrypt.stagingServer : self.conf.https.letsEncrypt.prodServer;

      if (!letsEncrServer) {
        throw new Error("Cannot set encrypt server.");
      }

      if (console.isDebug) {
        console.debug('Server:', letsEncrServer, 'with https conf:', self.conf.https);
      }

      self.lex = require('greenlock-express').create({
        server: letsEncrServer,
       
        approveDomains: function (opts, certs, cb) {
          if (certs) {
            // change domain list here
            opts.domains = certs.altnames;
          } else { 
            // change default email to accept agreement
            opts.email = self.conf.https.letsEncrypt.email; 
            opts.agreeTos = true;
          }
          cb(null, { options: opts, certs: certs });
        }
      });
    }

    return self.lex
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
      var http = require('http');

      var alwaysSecure = null;
      if (web.conf.https && web.conf.https.enabled) {
        if (web.conf.https.letsEncrypt) {
          //must do this manuall - npm install --global letsencrypt-cli
          var https = require('https');
          

          var lex = web.getLetsEncryptLex();

          var httpsPort = web.conf.https.port || 443;
          https.createServer(lex.httpsOptions, lex.middleware(web.app))
          .listen(httpsPort, web.conf.ipAddress, function(err, result) {
            if (err) {
              console.error(err);
            }
            console.log('%s: Node https server started on %s:%d ...',
                        Date(Date.now()), web.conf.ipAddress, httpsPort);

            if (cb) {
              cb(err, result);
            }
          });



        } else {
          var https = require('https');
          var privateKey = fs.readFileSync(web.conf.https.privateKey, 'utf8');
          var certificate = fs.readFileSync(web.conf.https.certificate, 'utf8');
          var credentials = {key: privateKey, cert: certificate};
          var httpsServer = https.createServer(credentials, web.app);

          httpsServer.listen(web.conf.https.port, web.conf.ipAddress, function(err, result) {
            if (err) {
              console.error(err);
            }
            console.log('%s: Node https server started on %s:%d ...',
                        Date(Date.now()), web.conf.ipAddress, web.conf.https.port);

            if (cb) {
              cb(err, result);
            }
          });
        }

        alwaysSecure = web.conf.https.alwaysSecure;
      }
      
      if (alwaysSecure && alwaysSecure.enabled) {
        var httpRedirecter = http.createServer(function(req, res) {

          if (alwaysSecure.redirectHandler) {
            alwaysSecure.redirectHandler(req, res);
          } else {  
            var nonStandardPort = '';
            if (web.conf.https.port != 443) {
              nonStandardPort = ':' + web.conf.https.port;
            }
            res.writeHead(302, {'Location': 'https://' + req.headers.host.split(':')[0] + nonStandardPort + req.url});
            res.end();
          }
        });

        httpRedirecter.listen(web.conf.port, web.conf.ipAddress, function(err, result) {
           if (err) {
              console.error(err);
            }
            
            console.log('%s: http redirecter server started on %s:%d ...',
                        Date(Date.now()), web.conf.ipAddress, web.conf.port);

            if (cb) {
              cb(err, result);
            }
        });
      } else {
        var httpServer = http.createServer(web.app);
        //  Start the app on the specific interface (and port).
        httpServer.listen(web.conf.port, web.conf.ipAddress, function(err, result) {
           if (err) {
              console.error(err);
            }
            
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now()), web.conf.ipAddress, web.conf.port);

            if (cb) {
              cb(err, result);
            }
        });
      }

    });
  }

});

module.exports = Web;