'use strict';

const extend = Object.assign;
const express = require('express');
const domain = require('domain');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const Schema = mongoose.Schema;
const flash = require('connect-flash');
const path = require('path');
const fs = require('fs');
const csrf = require('csurf');
const routeUtils = require('./utils/routeUtils');
const stringUtils = require('./utils/stringUtils.js');
const callsites = require('callsites');

/**
Oils web app
*/
class Web {

  constructor(conf) {
    //global.web = this;
    let web = this;
    web.lib = web.lib || {};

    Object.defineProperty(web.lib, 'mongoose', {
      get: function() {
        let stack = new Error().stack;
        console.warn("Use web.require('mongoose') instead of calling web.lib..", stack);
        return require('mongoose');
      }
    });

    if (!global._web) {
      global._web = {};
    }
    conf = conf || {};

    if (!conf.baseDir) {
      let tmpBaseDir = __filename.substr(0, __filename.indexOf('node_modules') - 1);
      if (!stringUtils.isEmpty(tmpBaseDir)) {
        conf.baseDir = tmpBaseDir;
      }
    }

    if (global._web[conf.baseDir]) {
      throw new Error("Web has been redefined " + conf.baseDir + " vs " + JSON.stringify(callerId.getData()));
    }

    global._web[conf.baseDir] = web;

    if (!global.hasOwnProperty('web')) {
      Object.defineProperty(global, 'web', {
        get: function() {
          if (Object.keys(global._web).length === 1) {
            return web;
          }

          for (let i in global._web) {
            if (stringUtils.startsWith(callsites()[1].getFileName(), i)) {
              //console.warn('Found new web! ' + i);
              return global._web[i];
            }
          }

          throw new Error("Web cache not found " + JSON.stringify(callerId.getData()));
          //return web;
        }
      })
    }
 
    //load custom config file
    this.conf = require('./conf/conf-default.js')();
    this.conf = extend(this.conf, conf);

    this.logger = require('./utils/logger.js')(this);
    
    if (this.conf.customConfigFile) {
      let customConf = requireNvm(path.join(this.conf.baseDir, this.conf.customConfigFile));
      if (customConf) {
        this.conf = extend(this.conf, customConf);
      }
    }

    //zconf: third config path for environmental / more private properties
    if (this.conf.zconf) {
      let zconf = requireNvm(this.conf.zconf);
      if (zconf) {
        this.conf = extend(this.conf, zconf);
        console.info('Found zconf.. extending.');
      } else {
        console.warn(web.conf.zconf, 'not found. Ignoring.');
      }
    }

    console.isDebug = this.conf.isDebug;
    if (console.isDebug) {
      console.debug('Oils config: ' + JSON.stringify(this.conf, null, 2));
    }

    this.app = express();
    this.events = {};
    this.modelCache = new Object();
    this.plugins = [];
  }

  //a way to use oils library so no need to re-install
  //e.g. const moment = web.require('moment');
  require(str) {
    return require(str);
  }

  requireNvm(str) {
    return requireNvm(str);
  }

  // EVENTS -----------
  on(eventStr, callback) {
    if (!this.events[eventStr]) {
      this.events[eventStr] = [];
    }

    this.events[eventStr].push(callback);
  }

  callEvent(eventStr, argsArray){
    let myEvents = this.events[eventStr];
    if (myEvents) {
      for (let myEvent of myEvents) {
        myEvent.apply(this, argsArray);
      }
    }
  }
  // EVENTS end -------

  include(file) {
    return require(this.includeFullPath(file));
  }

  includeNvm(file) {
    return requireNvm(this.includeFullPath(file));
  }

  includeFullPath(file) {
    let baseDir = this.conf.baseDir || process.cwd();
    return path.join(this.conf.baseDir, file);
  }

  //MODELS ------------

  includeModelObj(modelJs) {
    let web = this;
    let modelName = modelJs.name;
    
    if (!modelJs.schema) {
      throw new Error(modelName + '.schema not found.');
    }

    let collectionName = undefined;
    if (modelJs.parentModel) {
      
      let parentModel = web.includeModel(modelJs.parentModel);
      let parentModelJs = parentModel.getModelDictionary();
      collectionName = parentModel.collection.name;

      modelJs.schema = extend(parentModelJs.schema, modelJs.schema);
      
      let origSchema = modelJs.initSchema;
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

    }

    let conn;

    let getModelConnection = function(modelJs) {
      if (modelJs.connection) {
        return modelJs.connection
      }
      
      if (modelJs.parentModel) {
        return getModelConnection(web.include(modelJs.parentModel));
      }
    }

    let modelConn = getModelConnection(modelJs);
    if (modelConn) {
      conn = this.connections[modelConn];
      if (web.conf.isDebug) {
        console.debug("Found model conn: ", modelJs.name, modelConn);
      }
    } else if (web.connections.mainDb) {
      conn = web.connections.mainDb; 
    } else {
    for (let i in this.connections) {
        //get the first connection
        conn = this.connections[i];
        break;
      }
    }

    if (!conn) {
      console.warn('No defined DB. Check your configuration.');
      return;
    }
    
    let schema = new Schema(modelJs.schema, modelJs.options);

    //TODO: executing schemas of children are not a good idea
    if (modelJs.initSchema) {
      if (modelJs.initSchema instanceof Array) {
        for (let i in modelJs.initSchema) {
          let mySchema = modelJs.initSchema[i];
          
          mySchema(schema);
        }
      } else {
        //console.debug('[%s] Executing normal initSchema %s', modelJs.name ,modelJs.initSchema);
        //fixed bug where schemas are execd twice
        if (!modelJs.initSchema.execd) {
          modelJs.initSchema(schema);
        }
      }
      
    }

    let model = conn.model(modelName, schema, collectionName);
    if (console.isDebug) {
      console.debug("Loaded model for the first time: " + modelName)
    }

    web.modelCache[modelName] = model;
    model.getModelDictionary = function() {
      return modelJs;
    }        
    return model;
  }

  includeModel(workingPath) {

    let web = this;
    let modelJs = null;

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
  }

  models(modelName) {

    if (!this.modelCache[modelName]) {
      let workingPath = this.conf.modelsDir + '/' + modelName;
      this.modelCache[modelName] = this.includeModel(workingPath);
    }
    return this.modelCache[modelName];

  }

  //END MODELS --------


  addPlugin(plugin) {
    this.plugins[plugin.id] = plugin;
  }

  _getPluginFunction(plugin, webSelf) {
    return function(next) {
      plugin.load(plugin.conf, webSelf, next);

    }
  }

  loadPlugins(cb) {
    let self = this;
    let pluginFunctions = [];
    for (let i in self.plugins) {
      let plugin = self.plugins[i];
      pluginFunctions.push(self._getPluginFunction(plugin, self));

    }
    require('./utils/queueLoader.js')(pluginFunctions, [], cb);
  }

  //for deprection, use addRoutes whenever possible instead
  applyRoutes(routes) {
    let stack = new Error().stack;
    console.warn("Consider using web.addRoutes instead of applyRoutes.", stack);
    this._applyRoutes(routes);
  }

  _applyRoutes(routes) {
    for (let routeKey in routes) {
      let customRoute = routes[routeKey];
      if (console.isDebug) {
        console.debug('[conf.route] ' + routeKey);
      }
      routeUtils.applyRoute(web, routeKey, customRoute);
    }
  }

  addRoutes(routes) {
    this.conf.routes = this.conf.routes || {};
    for (let key in routes) {
      if (this.conf.routes[key]) {
        console.warn("Check conflicting routes:", key, confRoutes);
      }

      this.conf.routes[key] = routes[key];
    }
  }

  initServer() {
    let app = this.app;
    let web = this;
    let self = this;
    let bodyParser = require('body-parser');
    let methodOverride = require('method-override');
    let cookieParser = require('cookie-parser');
    let cookieSession = require('cookie-session');

  
    let templatesPath = path.join(self.conf.baseDir, self.conf.viewsDir);

    if (self.conf.templateLoader) {
      self.templateEngine = self.conf.templateLoader(web, templatesPath);
    } else {
      self.templateEngine = require('./engines/nunjucks')(web, templatesPath);
    }
    

    var rawBodySaver = function (req, res, buf, encoding) {
      if (web.conf.saveRawBody && buf && buf.length) {
        req.rawBody = buf.toString(encoding || 'utf8');
      }
    }
    

    app.use(bodyParser.json({limit: web.conf.parserLimit, verify: rawBodySaver}));
    app.use(bodyParser.urlencoded({
      extended: true,
      limit: web.conf.parserLimit,
      verify: rawBodySaver
    }));

    if (web.conf.saveRawBody) {
      console.warn("conf.saveRawBody uses a raw parser that conflicts with multer. Better maybe to save raw data in controller level instead.")
      // raw interferes with multer (upload files) 
      // https://github.com/expressjs/multer/issues/523
      // use sparingly or better move to controller level
      app.use(bodyParser.raw({ verify: rawBodySaver, type: '*/*', limit: web.conf.parserLimit}));
    }

    
    app.use(methodOverride());
    let cookieKey = web.conf.secretPassphrase;
    if (cookieKey === "change-this-it-is-2019!") {
      throw new Error("Security error. Change conf.secretPassphrase.");
    }
    app.use(cookieParser(cookieKey));
  
    app.use(cookieSession({keys: [cookieKey], 
      cookie: {maxAge: self.conf.cookieMaxAge},
      maxAge: self.conf.cookieMaxAge, //documentation is confusing that's why need to dup
    }));

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
      //use this for adding events prior to adding routes
      self.callEvent('loadPlugins');

      let confRoutes = self.conf.routes || {};

      confRoutes = extend(self.includeNvm(self.conf.routesFile) || {}, confRoutes);

      self.conf.routes = confRoutes;
      self._applyRoutes(self.conf.routes);
      require('./loaders/controllers')(self);
      
      self.callEvent('initServer');
    });

    app.use(self.conf.publicContext, express.static(path.join(self.conf.baseDir, self.conf.publicDir)));

    app.use(function(err, req, res, next){
      res.status(500);
      if (web.conf.handle500) {
        web.conf.handle500(err, req, res, next);
      } else {
        res.send("This is embarrassing.");
      }
      console.error("General error", err);
    });
    
  }

  getLetsEncryptLex() {
    let self = this;

    if (!self.lex) {
      let defaultHttpsConf = require('./conf/conf-https-default.js')(self);

      let defaultLetsEncryptConf = defaultHttpsConf.letsEncrypt || {};

      let confLetsEncrypt = self.conf.https && self.conf.https.letsEncrypt;

      self.conf.https = extend(defaultHttpsConf, self.conf.https || {});

      self.conf.https.letsEncrypt = extend(defaultLetsEncryptConf, confLetsEncrypt || {});

      if (!self.conf.https.letsEncrypt.email) {
        throw new Error("conf.https.letsEncrypt.email must not be nil.");
      }

      //validations
      let letsEncrServer = self.conf.https.letsEncrypt.testing ? self.conf.https.letsEncrypt.stagingServer : self.conf.https.letsEncrypt.prodServer;

      self.conf.https.letsEncrypt.server = self.conf.https.letsEncrypt.server || letsEncrServer;

      if (self.stringUtils.isEmpty(self.conf.https.letsEncrypt.server)) {
        throw new Error("Cannot find encrypt server.");
      }

      if (!self.conf.https.letsEncrypt.approveDomains) {
        throw new Error("conf.https.letsEncrypt.approveDomains must not be nil. See wildcard.js example from greenlock-express");
      }

      if (console.isDebug) {
        console.debug('Server:', letsEncrServer, 'with https conf:', self.conf.https);
      }


      self.lex = require('greenlock-express').create(self.conf.https.letsEncrypt);
    }

    return self.lex
  }

  /**
   * Start the server (starts up the sample application).
   * @param {Web~startCallback} cb - called after server starts.
   */
  start(cb) {
    let serverDomain = domain.create();
    serverDomain.on('error', function(err) {
      console.error('Server domain caught an exception: ' + err);
      if (err) {
        console.error(err.stack);
      }
    });

    let web = this;
    serverDomain.run(function() {

      // Initialize the express server and routes.
      web.initServer();
      let http = require('http');

      let alwaysSecure = null;

      let httpsConfigEnabled = web.conf.https && web.conf.https.enabled
      if (httpsConfigEnabled) {
        if (web.conf.https.letsEncrypt) {
          
          let https = self.conf.https.getHttpsServer();

          let lex = web.getLetsEncryptLex();

          let httpsPort = web.conf.https.port || 443;
          
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
          let https = self.conf.https.getHttpsServer();
          let privateKey = fs.readFileSync(web.conf.https.privateKey, 'utf8');
          let certificate = fs.readFileSync(web.conf.https.certificate, 'utf8');
          let credentials = {key: privateKey, cert: certificate};
          let httpsServer = https.createServer(credentials, web.app);

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
        let httpRedirecter = http.createServer(function(req, res) {

          if (alwaysSecure.redirectHandler) {
            alwaysSecure.redirectHandler(req, res);
          } else {  
            let nonStandardPort = '';
            if (web.conf.https.port !== 443) {
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
        let httpServer = http.createServer(web.app);
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

};




//collection of general utilties
Web.prototype.utils = require('./utils/oilsUtils.js');

//collection of common file utilities
Web.prototype.fileUtils = require('./utils/fileUtils.js');

//collection of common date utilities
Web.prototype.dateUtils = require('./utils/dateUtils.js');

//collection of common string utilities
Web.prototype.stringUtils = stringUtils;

//web.Plugin.extend..
Web.prototype.Plugin = require('./Plugin.js');

module.exports = Web;


function _applyRoutes(routes) {
  for (let routeKey in routes) {
    let customRoute = routes[routeKey];
    if (console.isDebug) {
      console.debug('[conf.route] ' + routeKey);
    }
    routeUtils.applyRoute(web, routeKey, customRoute);
  }
}

function requireNvm(libStr) {
  try {
    return require(libStr);
  } catch (er) {
    if (er.code === 'MODULE_NOT_FOUND') {
      if (console.isDebug) {
        console.debug('Ignoring file not found through requireNvm', libStr);
      }
      return null;
    } else {
      throw er;
    }
  }

  console.error("[requireNvm] Unexpected end");
}