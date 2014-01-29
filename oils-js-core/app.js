require('./include.js')();
require('./includeController.js')();

var express = require('express');
var swig = require('swig');

var log4js = require('log4js');
log4js.replaceConsole();

var App = function(opts) {
	var self = this;

    self.constants = require('./constants');

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
        require('./loaders/models.js')(self);
    }

    self._initConvenience = function() {


        //convenience methods
        global.oils = self;
        global.models = self.models;
        global.connections = self.connections;


        
    }


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {

        self._initLoaders();
        self._setupTerminationHandlers();

        // Create the express server and routes.
        self._initializeServer();

        self._initConvenience();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function(callback) {
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