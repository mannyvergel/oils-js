require('./include.js')();
require('./includeController.js')();

var express = require('express'),
  swig = require('swig'),
  flash = require('connect-flash');

var path = require('path');


var log4js = require('log4js');
log4js.replaceConsole();


var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var pluginUtils = require('./utils/pluginUtils');
var middlewares = require('./middlewares');

var App = function(opts) {
	var self = this;
  global.oils = self;

  self.constants = require('./constants');

  self.modelCache = new Object();

  self.includeModel = function(workingPath) {
    var app = self;

      var modelJs = include(workingPath);
      var modelName = modelJs.name;
      if (!modelName) {
        modelName = path.basename(workingPath, '.js');
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

        var schema = new Schema(modelJs.schema);
        if (modelJs.initSchema) {
          modelJs.initSchema(schema);
        }
        
        var model = conn.model(modelName, schema);
        pluginUtils.execDoAfterLoadModel(app, model);
        if (app.isDebug) {
          console.log("Loaded model for the first time: " + modelName)
        }

        
        return model;
  }

  global.includeModel = self.includeModel;

  self.models = function(modelName) {
    if (!self.modelCache[modelName]) {
      var workingPath = self.constants.MODELS_DIR + '/' + modelName;
      self.modelCache[modelName] = includeModel(workingPath);
    }
    //console.log("!!!!" + self.modelCache[modelName]);
    return self.modelCache[modelName];
    
  }


  global.models = self.models;

  self.events = {};

  self.execEvent = function(eventStr, argsArray){
    var myEvents = self.events[eventStr];
    for (var i in myEvents) {
      var myEvent = myEvents[i];
      myEvent.apply(self, argsArray);
    }
  }

  self.on = function(eventStr, callback) {
    if (!self.events[eventStr]) {
      self.events[eventStr] = [];
    }

    self.events[eventStr].push(callback);
  }

  /**
   *  terminator === the termination handler
   *  Terminate server on receipt of the specified signal.
   *  @param {string} sig  Signal to terminate on.
   */
  self.terminator = function(sig){
    if (typeof sig === "string") {
       console.log('%s: Received %s - terminating sample app ...',
                   Date(Date.now()), sig);
       process.exit(1);
    }
    console.log('%s: Node server stopped.', Date(Date.now()) );
  };


  /**
   *  Setup termination handlers (for exit and a list of signals).
   */
  self._setupTerminationHandlers = function(){
    //  Process on exit and signals.
    process.on('exit', function() { self.terminator(); });

    // Removed 'SIGPIPE' from the list - bugz 852598.
    ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
     'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
    ].forEach(function(element, index, array) {
        process.on(element, function() { self.terminator(element); });
    });
  };


  self._initializeServer = function() {
      
    self.server = express();
    var server = self.server;
    server.engine('html', swig.renderFile);

    server.set('view engine', 'html');
    server.set('views', global.BASE_DIR  + self.constants.VIEWS_DIR);

    server.use(express.json());
    server.use(express.urlencoded());

    server.use(express.methodOverride());

    server.use(express.cookieParser("hello oils 2014"));
    var oneDay = 86400000;
    server.use(express.cookieSession({cookie: {maxAge: oneDay}}));

    self.execEvent('initializeServer');

    server.use(middlewares.responsePatch(self));


    server.use(flash());

    pluginUtils.execInitializeServer(self);

    require('./loaders/routes.js')(self);

    server.use(express.static(global.BASE_DIR + self.constants.PUBLIC_DIR));


    server.configure('development', function(){
        console.log("Application is in Development mode!");
        server.set('view cache', false);
        // To disable Swig's cache, do the following:
        swig.setDefaults({ cache: false });
    });

  };

  self._initLoaders = function() {
    require('./loaders/conf.js')(self);
    for (var i in opts) {
        var opt = opts[i];
        console.log('Override conf %s from %s to %s', i, self.conf[i], opt);
        
        self.conf[i] = opt;
    }
    //convenience
    self.isDebug = self.conf.isDebug;

    require('./loaders/connections.js')(self);

    require('./loaders/plugins.js')(self);

    //require('./loaders/models.js')(self);
  }

  self._initConvenience = function() {
    //convenience methods
    global.connections = self.connections;
  }


  /**
   *  Initializes the sample application.
   */
  self.initialize = function() {

    self._initLoaders();
    self._setupTerminationHandlers();

  };


  /**
   *  Start the server (starts up the sample application).
   */
  self.start = function(callback) {

    // Create the express server and routes.
    self._initializeServer();

    self._initConvenience();
    
    //  Start the app on the specific interface (and port).
    self.server.listen(self.conf.port, self.conf.ipAddress, function(err, result) {
        console.log('%s: Node server started on %s:%d ...',
                    Date(Date.now() ), self.conf.ipAddress, self.conf.port);

        if (callback) {
            callback(err, result);
        }
    });
  };


  self.initialize();
}

module.exports = App;