'use strict';

const extend = Object.assign;
const express = require('express');
const domain = require('domain');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const flash = require('connect-flash');
const path = require('path');
const fs = require('fs');
const TokensCsrf = require('csrf')
const routeUtils = require('./utils/routeUtils');
const stringUtils = require('./utils/stringUtils.js');
const callsites = require('callsites');
const webExtender = require('./loaders/webExtender.js');
const {customAlphabet} = require('nanoid/non-secure');
const nanoidInsecure = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 10)

// Used for syncing for multiple servers
const _WebSetting = {
  name: '_WebSetting', 
  schema: {
    // do not support multiple web for now, assume all web setting here are unified
    key: {type: String, unique: true, index: true},
    val: {type: String},
    updateDt: {type: Date, default: Date.now},
  }
}

const wsCsrfKey = "CSRF_SECRET";

/**
Oils web app
*/
class Web {

  constructor(customConf) {

    const self = this;
    const web = self;
    self.lib = self.lib || {};

    let webId = nanoidInsecure();
    self.id = webId;

    Object.defineProperty(self.lib, 'mongoose', {
      get: function() {
        let stack = new Error().stack;
        console.warn("Use web.require('mongoose') instead of calling web.lib..", stack);
        return mongoose;
      }
    });

    if (!global._web) {
      global._web = {};
    }

    let conf = {};

    let webBaseDir = getBaseDirFromNodeModules(callsites()[0].getFileName());

    if (!webBaseDir) {
      console.warn("Cannot get base dir from callsites, trying dirname");
      webBaseDir = getBaseDirFromNodeModules(__dirname);  
    }

    if (!webBaseDir) {
      throw new Error("Web's baseDir should not be empty");
    }

    console.debug('Setting base dir to ', webBaseDir);
    
    if (!conf.baseDir) {
      conf.baseDir = webBaseDir;
    }

    // This is to catch multiple declaration of oils web app by checking if the baseDir was already defined
    if (global._web[conf.baseDir]) {
      throw new Error("Web has been redefined: " + conf.baseDir + " vs " + webBaseDir);
    }

    global._web[conf.baseDir] = self;
    global._webLength = Object.keys(global._web).length;

    if (!global.hasOwnProperty('web')) {
      Object.defineProperty(global, 'web', {
        get: function() {

          if (global._webLength === 1) {
            return self;
          }

          // [1] is the caller before Web
          let callStr = callsites()[1].getFileName();

          for (let i in global._web) {
            if (stringUtils.startsWith(callStr, i)) {
              return global._web[i];
            }
          }

          throw new Error(`Web cache not found: ${currWebBaseDir}.`);

        }
      })
    }
 
    //load custom config file
    self.conf = require('./conf/conf-default.js')();
    self.conf = extend(self.conf, conf);
    
    if (self.conf.customConfigFile) {
      let customConf = requireNvm(path.join(self.conf.baseDir, self.conf.customConfigFile));

      if (customConf) {
        self.conf = extend(self.conf, customConf);
      }
    }

    if (self.conf.pluginsConfPath) {
      console.log("Reading plugins conf", self.conf.pluginsConfPath);
      self.conf.plugins = self.conf.plugins || {};
      self.conf.plugins = extend(self.conf.plugins, self.includeNvm(self.conf.pluginsConfPath));
    }

    //zconf: third config path for environmental / more private properties
    if (self.conf.zconf === true) {
      let customConf = requireNvm(path.join(self.conf.baseDir, 'conf', 'zconf.js'));
      if (customConf) {
        console.info('Found zconf... extending.');
        self.conf = extend(self.conf, customConf);
      }
    } else if (self.conf.zconf) {
      let zconf = requireNvm(self.conf.zconf);
      if (zconf) {
        self.conf = extend(self.conf, zconf);
        console.info('Found zconf.. extending.');
      } else {
        console.warn(self.conf.zconf, 'not found. Ignoring.');
      }
    }

    if (customConf) {
      self.conf = extend(self.conf, customConf);
    }

    self.conf.webId = self.id;

    // only replace console.log etc once
    if (Object.keys(global._web).length <= 1) {
      self.logger = require('./utils/logger.js')(self.conf);
    } else {
      for (let i in global._web) {
        if (global._web[i].logger) {
          self.logger = global._web[i].logger;
          break;
        }
      }
    }

    console.isDebug = self.conf.isDebug;
    if (console.isDebug) {
      console.debug('Oils config: ' + JSON.stringify(self.conf, null, 2));
    }

    self.app = express();

    fixOpenRedirect(self);

    self.events = {};
    self.modelCache = new Object();
    self.plugins = [];

    self.overrideResponse();

    if (self.conf.extendWeb && self.conf.extendWeb.enabled) {
      webExtender.load(self, self.conf.extendWeb.path, self.conf.extendWeb.context);
    }

    console.log("Done with web constructor")
  }

  //a way to use oils library so no need to re-install
  //e.g. const moment = web.require('moment');
  require(str) {
    return require(str);
  }

  overrideResponse() {
    const self = this;
    // override default res.render
    const render = express.response.render;

    self.on('beforeRender', self.initBeforeRender)

    express.response.render = function(view, options = {}, callback) {
      const req = this.req;
      const res = this;

      self.callEvent('beforeRender', [view, options, callback, req, res])
      render.apply(this, [view, options, callback]);
    };

    // res.renderFile is deprecated, same as res.render
    // retained for backward compat
    express.response.renderFile = express.response.render;
  }

  initBeforeRender(view, options, callback, req, res) {
    const self = this;
    if (req.flash) {
      // it seems when 500 error is called, flash is not available
      // after it res.render was moved
      options['_errors'] = req.flash('error');
      options['_warns'] = req.flash('warn');
      options['_infos'] = req.flash('info');
    }
    options['_conf'] = self.conf.viewConf;
    options['_ext'] = req.ext;

    
      
    // Breaking Change: For post in a different controller,
    // it should be added enableCsrfToken true in the source controller
    if (self._shouldEnableCsrf(req)) {
      options['_csrf'] = self.genCsrfToken();
    }

  }

  _handleCsrf(req) {
    let self = this;
    if (!self.conf.enableCsrfToken) {
      return;
    }

    if (req.method === "POST") {

      let verifyCsrf = self._shouldEnableCsrf(req);

      // excludePaths will override controller's
      let excludePaths = self.conf.enableCsrfToken.excludes;
      if (excludePaths && excludePaths.length) {
        for (let path of excludePaths) {
          if ( (path instanceof RegExp && path.test(req.path))
            || (req.path === path)) {
            verifyCsrf = false;
          }
        }
      }

      if (verifyCsrf) {
        if (!self.csrfTokens.verify(self._getSecretToken(), req.body._csrf)) {
          throw new Error("Please try to submit the form again. Token verification failed.");
        }

        if (web.conf.isDebug) {
          console.debug("Successfully verified csrf:", req.body._csrf);
        }
      }
    }
  }

  _shouldEnableCsrf(req) {
    let self = this;
    if (!self.conf.enableCsrfToken) {
      return false;
    }

    // TODO: req._oilsController is undefined when verifying at POST
    if (req._oilsController) {
      // controller's enableCsrfToken option
      if (req._oilsController.enableCsrfToken === false) {
        return false;
      }

      if (!req._oilsController.post) {
        // Only enable _csrf for controllers with post methods to save performance
        return false;
      }
    }

    if (req.enableCsrfToken !== undefined) {
      // control via req like in wcm plugins
      return req.enableCsrfToken;
    }

    return true;
  }

  _getSecretToken() {
    return this.getWebSettingVal(wsCsrfKey);
  }

  async _initCsrfSecretToken() {

    let csrfSecretSetting = this.getWebSettingObj(wsCsrfKey);

    // refresh every one day + server restart (does not guarantee one day can be more depending when servers are restarted)
    if (csrfSecretSetting
      && Math.abs((new Date()).getTime() - csrfSecretSetting.updateDt.getTime()) < this.conf.csrfSecretRefreshMs) {
      return csrfSecretSetting.val;
    }

    let secret = this.csrfTokens.secretSync();

    this.setWebSetting(wsCsrfKey, secret);

    this.conf.isDebug && console.debug("Refreshed csrf secret");

    return secret;
  }

  async _initWebSettingVals() {
    await this._initCsrfSecretToken();

    // other web setting init that needs DB sync goes here
  }

  async _initWebSettingRefresh() {
    const _WebSettingModel = this._getWebSettingModel();
    const self = this;

    if (!this.syncedSetting) {
      self.syncedSetting = {};
    }

    await this._refreshWebSettings();

    // not moved to refresh loop because we don't need these settings constantly updated (for now)
    // will just init once on server restart
    await this._initWebSettingVals();
    
    // This is needed because in the case of multiple servers, not restarting one will result in out-of-sync
    setInterval(() => {self._refreshWebSettings();}, self.conf.refreshWebSettingInt);

  }

  async _refreshWebSettings() {
    const _WebSettingModel = this._getWebSettingModel();

    let arrKeyVals = await _WebSettingModel.find({}).lean().exec();
    for (let keyVal of arrKeyVals) {
      this.syncedSetting[keyVal.key] = keyVal;
    }

    this.conf.isDebug && console.debug("Web setting refreshed:", Object.keys(this.syncedSetting));
  }

  _getWebSettingModel() {
    return this.modelCache['_WebSetting'] || this.includeModelObj(_WebSetting)
  }

  getWebSettingObj(key) {
    if (!this.syncedSetting) {
      throw new Error("Web setting not yet initialized. Only usable after connection has been initiated.");
    }

    let webSetting = this.syncedSetting[key];
 
    return webSetting;
  }

  getWebSettingVal(key) {
    return this.getWebSettingObj(key).val;
  }

  setWebSetting(key, val) {
    let ws = this.syncedSetting[key];
    let origVal = ws && ws.val;

    if (val !== origVal) {
      this.syncedSetting[key] = {key: key, val: val, updateDt: new Date()};

      // async; should be okay not to wait since this is cached, and other servers are at an interval
      this._updateSettingToDb(key, val);
    }
  }

  async _updateSettingToDb(key, val) {
    const _WebSettingModel = this._getWebSettingModel();
    let webSetting = this.syncedSetting[key];

    if (!webSetting) {
      throw new Error("Web setting not found: " + key);
    }

    let webSettingDb = await _WebSettingModel
      .findOneAndUpdate({key: key}, {key: key, val: val, updateDt: new Date()}, {upsert: true})
      .exec();

    this.conf.isDebug && console.debug("Updated web setting to DB:", key);
  }

  genCsrfToken() {
    if (!this.conf.enableCsrfToken) {
      return '';
    }

    return this.csrfTokens.create(this._getSecretToken());  
  }

  // requireNvm - cannot define this as a utility because it will never work
  // because it will require from this directory.
  // use includeNvm instead

  // EVENTS -----------
  on(eventStr, callback) {
    if (!this.events[eventStr]) {
      this.events[eventStr] = [];
    }

    this.events[eventStr].push(callback);
  }

  // use call if you want async
  callEvent(eventStr, argsArray){
    let myEvents = this.events[eventStr];
    if (myEvents) {
      for (let myEvent of myEvents) {
        myEvent.apply(this, argsArray);
      }
    }

  }

  async call(eventStr, argsArray){
    let myEvents = this.events[eventStr];
    if (myEvents) {
      for (let myEvent of myEvents) {
        try {
          await myEvent.apply(this, argsArray);
        } catch (ex) {
          console.error("Error loading one event", eventStr, ex);
        }
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

  async loadPlugins(cb) {
    let self = this;
    let pluginFunctions = [];

    // delete the concept of next in the far future, loading of functions are now async
    let nextObsolete = function(){};

    for (let pluginId in self.plugins) {
      let plugin = self.plugins[pluginId];
      try {
        await plugin.load(plugin.conf, self, nextObsolete);
      } catch (ex) {
        console.error("Error loading plugin", pluginId, ex);
      }
    }

    if (cb) {
      cb();
    }
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

  async initServer(cb) {
    const app = this.app;
    const web = this;
    const self = this;
    const bodyParser = require('body-parser');
    const methodOverride = require('method-override');
    const session = require('express-session');
    const MongoStore = require('connect-mongo');

    let httpsConfigEnabled = (web.conf.https && web.conf.https.enabled) || web.conf.httpsOpts.httpsEnabled;

    if (httpsConfigEnabled) {
      let defaultHttpsConf = require('./conf/conf-https-default.js')(web);

      let defaultLetsEncryptConf = defaultHttpsConf.letsEncrypt || {};

      let confLetsEncrypt = web.conf.https && web.conf.https.letsEncrypt;

      web.conf.https = extend(defaultHttpsConf, web.conf.https || {});

      web.conf.https.letsEncrypt = extend(
        defaultLetsEncryptConf,
        confLetsEncrypt || {},
        web.conf.httpsOpts.letsEncrypt
      );
    }

  
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

    if (web.conf.trustProxy) {
      console.log("Trusting proxy", web.conf.trustProxy);
      app.set('trust proxy', web.conf.trustProxy);
    }

    app.use(bodyParser.json({limit: web.conf.parserLimit, verify: rawBodySaver, parameterLimit: web.conf.parserParameterLimit}));
    app.use(bodyParser.urlencoded({
      extended: true,
      limit: web.conf.parserLimit,
      verify: rawBodySaver,
      parameterLimit: web.conf.parserParameterLimit
    }));

    if (web.conf.saveRawBody) {
      console.warn("conf.saveRawBody uses a raw parser that conflicts with multer. Better maybe to save raw data in controller level instead.")
      // raw interferes with multer (upload files) 
      // https://github.com/expressjs/multer/issues/523
      // use sparingly or better move to controller level

      let bodyParserFunc = bodyParser.raw({
        verify: rawBodySaver,
        type: '*/*',
        limit: web.conf.parserLimit,
        parameterLimit: web.conf.parserParameterLimit
      });
      
      app.use(function(req, res, next) {
        if (web.conf.saveRawBody.only) {
          if (!req.path || !web.conf.saveRawBody.only.includes(req.path)) {
            next();
            return;
          }
        }

        bodyParserFunc(req, res, next);

      });
      
    }

    
    app.use(methodOverride());
    let cookieKey = web.conf.secretPassphrase;
    if (cookieKey === "change-this-it-is-2019!") {
      throw new Error("Security error. Change conf.secretPassphrase.");
    }

    app.use(session(web.conf.sessionOpts || {
      name: 'oils-session', // should be okay even with mongo in the same since store should be different per app
      secret: cookieKey,
      httpOnly: true,
      secure: true,
      maxAge: self.conf.cookieMaxAge,
      resave: false,
      saveUninitialized: true,

      // this will create "sessions" collection in the DB
      // TODO: check for oils support without DB
      store: MongoStore.create({
        mongoUrl: web.conf.connections.mainDb.url,
        touchAfter: 24 * 3600, // https://github.com/jdesboeufs/connect-mongo/issues/152
      })
    }));

    app.use(function(req, res, next) {
      // Because of old cookie-session replaced by express-session
      // TODO: should we deprecate?
      // It needs to be wrapped in a function for access to to self
      req.csrfToken = function() {return self.genCsrfToken();}

      next();
    })

    await self.call('afterWebMiddleware');
   
    app.use(require('./middleware/custom-response.js')());
    app.use(flash());

    if (web.conf.validateNoSqlInject) {
      console.log("Adding validation for nosql injection");
      
      app.use(function(req, res, next) {
        //prevent NOSQL injection for mongoose
        let valid = false;
        try {
          web.validateNoSqlInject(req.query);
          web.validateNoSqlInject(req.body);
          web.validateNoSqlInject(req.params);
          valid = true;
        } catch (ex) {
          console.error('Error in validation nosql', ex);
          var ip = req.header('x-forwarded-for') || (req.connection && req.connection.remoteAddress);
          console.error("[ALERT] Possible NOSQL injection", req.url, req.query, req.body, req.params, ip, req.user);
          res.status(400).send("Invalid Request");
        }

        if (valid) {
          next();
        }

      });
    }

    await require('./loaders/connections.js')(self);

    if (self.conf.enableCsrfToken) {
      self.csrfTokens = new TokensCsrf();
    }

    await self._initWebSettingRefresh();

    require('./loaders/plugins.js')(self);
    
    await self.loadPlugins();

    //use this for adding events prior to adding routes
    await self.call('loadPlugins');

    let confRoutes = self.conf.routes || {};

    confRoutes = extend(self.includeNvm(self.conf.routesFile) || {}, confRoutes);

    self.conf.routes = confRoutes;
    self._applyRoutes(self.conf.routes);
    await require('./loaders/controllers')(self);

    if (self.conf.enableCsrfToken && self.conf.enableCsrfToken.universal) {

      app.use(function(req, res, next) {

        try {
          self._handleCsrf(req);
          next();
        } catch (err) {
          console.error("Error Web's _handleCsrf:", err);
          web.conf.handleCsrfFailure(err, req, res);
        }
        
      });
      
    }

    app.use(self.conf.publicContext, 
      express.static(
        path.join(self.conf.baseDir, self.conf.publicDir), {maxAge: self.conf.staticMaxAge}
      )
    );
    
    await self.call('initServer');
    
    app.use(function(err, req, res, next){
      res.sendStatus(500);
      if (web.conf.handle500) {
        web.conf.handle500(err, req, res, next);
      } else {
        res.send("This is embarrassing.");
      }
      console.error("General error", err);
    });


    if (cb) {
      await cb();
    }
    
  }

  validateNoSqlInject(query) {
    if (query) {
      for (let key in query) {
        if (key && key[0] === '$') {
          console.error("Invalid key found", key);
          throw new Error("Invalid request [999]");
        }

        if (query[key] && typeof query[key] == 'object') {
          this.validateNoSqlInject(query[key]);
        }
      }
    }

    return query;
  }

  getLetsEncryptLex() {
    let self = this;

    if (!self.lex) {

      if (!self.conf.https.letsEncrypt.email) {
        throw new Error("conf.https.letsEncrypt.email must not be nil.");
      }

      //validations
      let letsEncrServer = self.conf.https.letsEncrypt.testing ? self.conf.https.letsEncrypt.stagingServer : self.conf.https.letsEncrypt.prodServer;

      self.conf.https.letsEncrypt.server = self.conf.https.letsEncrypt.server || letsEncrServer;

      if (self.stringUtils.isEmpty(self.conf.https.letsEncrypt.server)) {
        throw new Error("Cannot find encrypt server.");
      }

      // check conf-https-default.js for the default function
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
      // we don't await because of unknown behavior with domains
      web.initServer(function() {
        startServer(web, cb);
      });


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

Web.prototype.objectUtils = require('./utils/objectUtils.js');

Web.prototype.sleep = sleep;

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

async function sleep(ms) {
  return new Promise(function(resolve, reject) {
    return setTimeout(resolve, ms);
  })
}


function startListening(httpServer, opts = {}, cb) {
  const {port, ipAddress, addtlLog = ""} = opts;
  httpServer.listen(port, ipAddress, function(err, result) {
     if (err) {
        console.error("Error starting node server", err);
      } else {
        console.log('%s: Node server started on %s:%d %s...',
                  Date(Date.now()), ipAddress, port, addtlLog);
      }
      
      if (cb) {
        cb(err, httpServer, opts);
      }
  });
}

function defaultRedirectToHttpsMiddleware(req, res) {
  let nonStandardPort = '';
  let portToUse = (web.conf.httpsOpts.port || web.conf.https.port);
  if (portToUse !== 443) {
    nonStandardPort = ':' + portToUse;
  }

  let hostStr;
  if (req.headers.host) {
    hostStr = req.headers.host.split(':')[0]
  } else {
    hostStr = req.hostname;
  }
  res.writeHead(302, {'Location': 'https://' + hostStr + nonStandardPort + req.url});
  res.end();
}

function fixOpenRedirect(web) {
  // Fix for open redirect security
  let redirectSafe = web.app.response.redirect;
  web.app.response.redirectSafe = function(url) {
    return redirectSafe.call(this, url);
  }

  let addHostOnceFlag = true;
  let addWwwOnceFlag = true; 

  web.app.response.redirect = function(param1, param2) {

    let url, status;
    if (!isNaN(param1)) {
      status = param1;
      url = param2;
    } else {
      url = param1;
    }
  
    if (url && url.indexOf('://') != -1) {

      let req = this.req;

      if (addHostOnceFlag) {
        let host = req.protocol + '://' + req.headers.host;
        web.conf.allowedRedirectHosts.push(host);

        addHostOnceFlag = false;
        console.log("Added host once: " + host);
      }

      if (addWwwOnceFlag) {
        if (req.subdomains && !req.subdomains.length) {
          let wwwHost = req.protocol + '://www.' + req.headers.host;
          web.conf.allowedRedirectHosts.push(wwwHost);

          addWwwOnceFlag = false;
          console.log("Added www host once: " + wwwHost);
        }
      }

      const found = web.conf.allowedRedirectHosts.find(el => url.indexOf(el) == 0);

      if (!found) {
        var ip = web.utils.getClientIp(req);

        console.warn("Open redirect vulnerability was triggered: ", url, req.method, req.user ? req.user.email : "unsigned user", ip, "accessed", req.url, req.headers['user-agent']);
        throw new Error("Action not allowed.");
      }

    }
    return redirectSafe.call(this, url);
  }
}

function getBaseDirFromNodeModules(pathStr) {
  return pathStr.substr(0, pathStr.indexOf('node_modules') - 1);
}

function startServer(web, cb) {

  const http = require('http');

  let alwaysSecure = null;

  let httpsConfigEnabled = (web.conf.https && web.conf.https.enabled) || web.conf.httpsOpts.httpsEnabled;

  let middlewareToUse = function(anotherMiddleware) {
    return anotherMiddleware;
  }
  
  if (httpsConfigEnabled) {
    if (web.conf.https.letsEncrypt) {
      
      let https = web.conf.https.getHttpsServer();
      let lex = web.getLetsEncryptLex();
      let httpsPort = web.conf.https.port || 443;

      middlewareToUse = lex.middleware;
      
      let httpServer = https.createServer(lex.httpsOptions, middlewareToUse(web.app));
      startListening(httpServer, {port: httpsPort, ipAddress: web.conf.ipAddress, addtLog: "(HTTPS)"}, cb);

    } else {
      let https = web.conf.https.getHttpsServer();
      let privateKey = fs.readFileSync(web.conf.https.privateKey, 'utf8');
      let certificate = fs.readFileSync(web.conf.https.certificate, 'utf8');
      let credentials = {key: privateKey, cert: certificate};

      let httpsServer = https.createServer(credentials, web.app);
      startListening(httpServer, {port: web.conf.port, ipAddress: web.conf.ipAddress, addtlLog: "(HTTPS)"}, cb);
    }

    alwaysSecure = web.conf.https.alwaysSecure;
  }
  
  if ((alwaysSecure && alwaysSecure.enabled) || web.conf.httpsOpts.alwaysSecure) {
    let redirectMiddleware = alwaysSecure.redirectHandler 
      || defaultRedirectToHttpsMiddleware;

    let httpRedirecter = http.createServer(middlewareToUse(redirectMiddleware));
    startListening(httpRedirecter, {port: web.conf.port, ipAddress: web.conf.ipAddress}, cb);
  } else {
    let httpServer = http.createServer(middlewareToUse(web.app));
    startListening(httpServer, {port: web.conf.port, ipAddress: web.conf.ipAddress}, cb);
  }
}
  

