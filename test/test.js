//MOCHA test
//run the ff before starting this test
//> npm install
//var TEMP_DIR = 'C:/temp'



global.BASE_DIR = 'c:/tmp/oils';

try {
fs.mkdirsSync(global.BASE_DIR);
} catch(e) {
  
}

var fs = require('fs-extra');

var assert = require("assert");

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
  this.timeout(20000);
  before (function (done) {
  	fs.copySync('./templates/basic', global.BASE_DIR);
    fs.copySync('./templates/zurb5', global.BASE_DIR);

    fs.remove(BASE_DIR + '/node_modules', function(err) {
      try {
        fs.mkdirSync(BASE_DIR + '/node_modules');

        fs.mkdirSync(BASE_DIR + '/node_modules/oils')
      } catch(e) {
        console.log(BASE_DIR + '/node_modules already exists. Skipping create.')
      }

      fs.copy('./',  BASE_DIR + '/node_modules/oils', function(err) {
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
    assert.notStrictEqual(app.plugins, undefined, 'app.plugins not found');
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

    assert.doesNotThrow(function() {
        var Book = models('Book');
        if (!Book) {
          throw new Error('Book is null')
        }
      }, 'Retrieving Book');

    done();

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