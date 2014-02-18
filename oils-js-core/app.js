require('./include.js')();
require('./includeController.js')();

var express = require('express'),
  swig = require('swig'),
  flash = require('connect-flash');

var domain = require('domain');

var path = require('path');

var log4js = require('log4js');
log4js.replaceConsole();

var pluginUtils = require('./utils/pluginUtils');
var middlewares = require('./middlewares');

var App = function(opts) {
  var app = this;

  global.oils = app;

  app.constants = require('./constants');

  require('./loaders/models')(app);

  app.events = {};

  app.callEvent = function(eventStr, argsArray){
    var myEvents = app.events[eventStr];
    for (var i in myEvents) {
      var myEvent = myEvents[i];
      myEvent.apply(app, argsArray);
    }
  }

  app.on = function(eventStr, callback) {
    if (!app.events[eventStr]) {
      app.events[eventStr] = [];
    }

    app.events[eventStr].push(callback);
  }

  /**
   *  terminator === the termination handler
   *  Terminate server on receipt of the specified signal.
   *  @param {string} sig  Signal to terminate on.
   */
  app.terminator = function(sig){
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
  app._setupTerminationHandlers = function(){
    //  Process on exit and signals.
    process.on('exit', function() { app.terminator(); });

    // Removed 'SIGPIPE' from the list - bugz 852598.
    ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
     'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
    ].forEach(function(element, index, array) {
        process.on(element, function() { app.terminator(element); });
    });
  };


  app._initializeServer = function() {
      
    app.server = express();
    var server = app.server;
    server.engine('html', swig.renderFile);

    server.set('view engine', 'html');
    server.set('views', global.BASE_DIR  + app.constants.VIEWS_DIR);

    server.use(express.json());
    server.use(express.urlencoded());

    server.use(express.methodOverride());

    server.use(express.cookieParser("hello oils 2014"));
    var oneDay = 86400000;
    server.use(express.cookieSession({cookie: {maxAge: oneDay}}));

    app.callEvent('initializeServer');

    server.use(middlewares.responsePatch(app));


    server.use(flash());

    
    require('./loaders/routes.js')(app);

    server.use(express.static(global.BASE_DIR + app.constants.PUBLIC_DIR));


    server.configure('development', function(){
        console.log("Application is in Development mode!");
        app.isDev = true;
        server.set('view cache', false);
        // To disable Swig's cache, do the following:
        swig.setDefaults({ cache: false });
    });

  };

  app._initLoaders = function() {
    require('./loaders/conf.js')(app);
    for (var i in opts) {
        var opt = opts[i];
        console.log('Override conf %s from %s to %s', i, app.conf[i], opt);
        
        app.conf[i] = opt;
    }
    //convenience
    app.isDebug = app.conf.isDebug;

    require('./loaders/connections.js')(app);

    require('./loaders/plugins.js')(app);

  }

  app._initConvenience = function() {
    //convenience methods
    global.connections = app.connections;
  }


  /**
   *  Initializes the sample application.
   */
  app.initialize = function() {

    app._initLoaders();
    app._setupTerminationHandlers();

  };


  /**
   *  Start the server (starts up the sample application).
   */
  app.start = function(callback) {
    var serverDomain = domain.create();
    serverDomain.on('error', function(err) {
      console.log('Server caught an exception: ' + err);
      if (err) {
        console.error(err.stack);
      }
    });
    serverDomain.run(function() {

      // Create the express server and routes.
      app._initializeServer();

      app._initConvenience();
      
      //  Start the app on the specific interface (and port).
      app.server.listen(app.conf.port, app.conf.ipAddress, function(err, result) {
          console.log('%s: Node server started on %s:%d ...',
                      Date(Date.now() ), app.conf.ipAddress, app.conf.port);

          if (callback) {
              callback(err, result);
          }
      });
    });
  };


  app.initialize();
}

module.exports = App;