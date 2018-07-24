//MOCHA test
//run the ff before starting this test
//> npm install
//var TEMP_DIR = 'C:/temp'



//global.BASE_DIR = 'c:/tmp/oils';
global.BASE_DIR = process.cwd() + '/../tmp/oilsjstest';

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
  port: 3000,
  baseDir: global.BASE_DIR,
  https: {
    enabled: false,
    letsEncrypt: {
      email:'manny@mvergel.com',
      testing: true
    },
    port: 8443,
    alwaysSecure: {
      enabled: false
    }
  }
}

var web;
describe('app', function () {
  this.timeout(40000);
  before (function (done) {
  	fs.copySync('./templates/basic', global.BASE_DIR);

    fs.remove(BASE_DIR + '/node_modules', function(err) {
      try {
        fs.mkdirSync(BASE_DIR + '/node_modules');

        fs.mkdirSync(BASE_DIR + '/node_modules/oils')
      } catch(e) {
        console.log(BASE_DIR + '/node_modules already exists. Skipping create.')
      }

      fs.copy('./',  BASE_DIR + '/node_modules/oils', function(err) {
        var Web = includeOils('/core/Web.js');
        web = new Web(overrideConf);
        web.start(function (err, result) {
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
    assert.notStrictEqual(web.conf, undefined, 'web.conf not found');
    assert.notStrictEqual(web.connections, undefined, 'web.connections not found');
    assert.notStrictEqual(web.models, undefined, 'web.models not found');
    assert.notStrictEqual(web.plugins, undefined, 'web.plugins not found');
    assert.notStrictEqual(web.include, undefined, 'web.include not found');
    assert.notStrictEqual(web.includeModel, undefined, 'web.includeModel not found');
    assert.notStrictEqual(web.require('moment'), null, 'web.require not working');
    done();
  });

  it('should have functioning utilities', function (done) {
    assert.equal(web.utils.getMimeType('asd.png'), 'image/png', 'getMimeType not functioning correctly.');
    assert.notStrictEqual(web.getLetsEncryptLex(), undefined, 'web.getLetsEncryptLex not working');

    assert.notStrictEqual(web.stringUtils, undefined, 'web.stringUtils not found');
    assert.strictEqual(web.stringUtils.escapeHTML("<Test>"), "&lt;Test&gt;", 'web.stringUtils.escaepHTML is invalid');


    assert.notStrictEqual(web.dateUtils, undefined, 'web.dateUtils not found');
    assert.strictEqual(web.dateUtils.formatDate(new Date("April 30 1985"), "YYYYMMDD"), "19850430", 'web.dateUtils.format is invalid');

    done();
  });

  it('should have correct globals', function (done) {

    assert.notStrictEqual(global.web, undefined, 'global.web not found');
    done();
  });

  it('should have loaded models', function (done) {

    assert.doesNotThrow(function() {
        var Book = web.models('Book');
        if (!Book) {
          throw new Error('Book is null')
        }
      }, 'Retrieving Book');


    var childModelJs = {
      name: 'Book2',
      schema: {hello: {type: String}},
      parentModel: '/web/src/models/Book'
    }

    var childModel = web.includeModelObj(childModelJs);

    assert.equal(childModel.collection.name, 'books', 'Collection name must be books');
    assert.notStrictEqual(childModel.getModelDictionary().schema.title, undefined, 'parent Book title not found');


    //test load from cache
    var Book = web.models('Book');
    assert.notStrictEqual(Book.getModelDictionary().schema.title, undefined, 'Cached Book title not found');
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