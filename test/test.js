//MOCHA test
//run the ff before starting this test
//> npm install
global.BASE_DIR = __dirname + '/tmp';

var assert = require("assert");
var fs = require('fs');
var oilsBaseDir = global.BASE_DIR + '/node_modules/oils';
var includeOils = function(dir) {
	return require(oilsBaseDir + dir);
}

var overrideConf = {
  isDebug: true,
  port: 3000
}

var app;
describe('app', function () {
 
  before (function (done) {
  	var ncp = require('ncp');
  	ncp('./template', './test/tmp', function(err) {
  		if (err) {
  			console.log('ERROR! ' + err);
  		}
  		var opts = {
  			filter: /^((?!(tmp)).)*$/
  		}
  		try {
  			fs.mkdirSync('./test/tmp/node_modules');

  			fs.mkdirSync('./test/tmp/node_modules/oils')
  		} catch(e) {
  			console.log('./test/tmp/node_modules already exists. Skipping create.')
  		}
  		
  		ncp('./', './test/tmp/node_modules/oils', opts, function(err) {
	  		if (err) {
	  			console.log('ERROR2! ' + err);
	  		}
        var MyApp = includeOils('/oils-js-core/app.js');
	  		app = new MyApp(overrideConf);
		    app.start(function (err, result) {
		      if (err) {
		        done(err);
		      } else {
		        done();
		      }
		  	});
	  	});
  		
  	});

  	
  });
 
  after(function (done) {
    done();
  });
 
  it('should have correct attributes', function (done) {
    assert.notStrictEqual(app.conf, undefined, 'app.conf not found');
    assert.notStrictEqual(app.connections, undefined, 'app.connections not found');
    assert.notStrictEqual(app.models, undefined, 'app.models not found');
    assert.notStrictEqual(app.isDebug, undefined, 'app.isDebug not found');
    
    done();
  });

  it('should have correct globals', function (done) {

    assert.notStrictEqual(global.oils, undefined, 'global.oils not found');
    assert.notStrictEqual(global.include, undefined, 'global.include not found');
    
    assert.notStrictEqual(global.includeController, undefined, 'global.includeController not found');
    assert.notStrictEqual(global.models, undefined, 'global.models not found');
    done();
  });

  it('should have loaded models', function (done) {
    setTimeout(function() {
      var modelCount = 0;
      for (var i in app.models) {
        modelCount++;
      }
      assert.equal(modelCount, 1, 'Model count');
      done();
    }, 1500)

  });

  var http = require('http');

  it('should connect', function (done) {
    http.get("http://127.0.0.1:" + overrideConf.port, function(res) {

      assert.equal(res.statusCode, 200, 'Status of localhost');
      done();
    }).on('error', function(e) {
      assert.ok('false', 'Error connecting ' + e);
      done();
    });
    
  });
 

 
});