//MOCHA test
//run the ff before starting this test
//> npm install
//let TEMP_DIR = 'C:/temp'

'use strict';

//global.BASE_DIR = 'c:/tmp/oils';
global.BASE_DIR = process.cwd() + '/../tmp/oilsjstest';

try {
  fs.mkdirsSync(global.BASE_DIR);
} catch(e) {
  
}

const fs = require('fs');
const fileUtils = require('../core/utils/fileUtils.js');
const assert = require("assert");

const oilsBaseDir = global.BASE_DIR + '/node_modules/oils';
let includeOils = function(dir) {
	return require(oilsBaseDir + dir);
}

let overrideConf = {
  isDebug: true,
  enableCsrfToken: true,
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
  },

  handleCsrfFailure: function(err, req, res) {
    res.sendStatus(500);
  },

  exitTest: true,
}


let web;
describe('app', function () {
  this.timeout(40000);
  before (function (done) {
  	fileUtils.copySync('./templates/basic', global.BASE_DIR, {force: true});

    fileUtils.removeDirSync(BASE_DIR + '/node_modules');
    try {
      fs.mkdirSync(BASE_DIR + '/node_modules');
    } catch(e) {
      console.log(BASE_DIR + '/node_modules already exists. Skipping create.')
    }

    try {
      fs.mkdirSync(BASE_DIR + '/node_modules/oils')
    } catch(e) {
      console.log(BASE_DIR + '/node_modules/oils already exists. Skipping create.')
    }

    fileUtils.copySync('./',  BASE_DIR + '/node_modules/oils', {force: true});

    let Web = includeOils('/core/Web.js');
    web = new Web(overrideConf);
    web.start(function (err, result) {
      if (err) {
        done(err);
      } else {
        done();
      }
    });


      


    
    
  });
 
  after(async function() {
    await web.sleep(2000);
    console.log("Done with tests.. exiting.");
    
    if (web.conf.exitTest) {
      process.exit();
    }
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

  it('should have functioning utilities', async function () {
    assert.equal(web.utils.getMimeType('asd.png'), 'image/png', 'getMimeType not functioning correctly.');
    //assert.notStrictEqual(web.getLetsEncryptLex(), undefined, 'web.getLetsEncryptLex not working');

    assert.notStrictEqual(web.stringUtils, undefined, 'web.stringUtils not found');
    assert.strictEqual(web.stringUtils.escapeHTML("<Test>"), "&lt;Test&gt;", 'web.stringUtils.escaepHTML is invalid');


    assert.notStrictEqual(web.dateUtils, undefined, 'web.dateUtils not found');
    assert.strictEqual(web.dateUtils.formatDate(new Date("April 30 1985"), "YYYYMMDD"), "19850430", 'web.dateUtils.format is invalid');

    assert(web.objectUtils.isClass(class extends web.Plugin {}), "web.objectUtils problem");


  });

  it('should have correct globals', function (done) {

    assert.notStrictEqual(global.web, undefined, 'global.web not found');
    done();
  });

  it('should have loaded models', function (done) {

    assert.doesNotThrow(function() {
        let Book = web.models('Book');
        if (!Book) {
          throw new Error('Book is null')
        }
      }, 'Retrieving Book');


    let childModelJs = {
      name: 'Book2',
      schema: {hello: {type: String}},
      parentModel: '/web/src/models/Book'
    }

    let childModel = web.includeModelObj(childModelJs);

    assert.equal(childModel.collection.name, 'books', 'Collection name must be books');
    assert.notStrictEqual(childModel.getModelDictionary().schema.title, undefined, 'parent Book title not found');


    //test load from cache
    let Book = web.models('Book');
    assert.notStrictEqual(Book.getModelDictionary().schema.title, undefined, 'Cached Book title not found');
    done();

  });

  let http = require('http');

  it('should connect', function (done) {
    http.get("http://127.0.0.1:" + web.conf.port, function(res) {

      assert.equal(res.statusCode, 200, 'Status of localhost');
      done();
    }).on('error', function(e) {
      console.log("Error:",e);
      assert.ok(false, 'Error connecting ' + e);
      done();
    });
    
  });

  
  it('should submit form', async function () {

    if (web.conf.enableCsrfToken) {
      let res = await fetch(`http://127.0.0.1:${web.conf.port}`, {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          _csrf: web.csrfTokens.create(web._getSecretToken()),
          testData: 'Hello World'
        }),
      })

      assert.equal(res.status, 200, 'Form submission');
      
    }

  });

  it('should fail to submit form with invalid token', async function () {

    if (web.conf.enableCsrfToken) {
      web.conf.suppressRouteError = true;
      let res = await fetch(`http://127.0.0.1:${web.conf.port}`, {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          _csrf: '',
          testData: 'Hello World'
        }),
      })
      web.conf.suppressRouteError = false;
      assert.equal(res.status, 500, 'Form submission with invalid token');
      
    }

  });


  it('should connect to contact', function (done) {
    let url = 'http://127.0.0.1:' + web.conf.port + '/contact';
    http.get(url, function(res) {

      assert.equal(res.statusCode, 200, 'Status of ' + url);
      done();
    }).on('error', function(e) {
      console.log("Error:",e);
      assert.ok(false, 'Error connecting ' + e);
      done();
    });
    
  });

  it('should generate random string', async function() {
    try {
      let randomString = await web.stringUtils.genSecureRandomString();
      console.log("Random string generated", randomString);
      assert.ok(!web.stringUtils.isEmpty(randomString), "Error generating random string. Generated " + randomString);
    } catch (ex) {
      console.log("Error:",ex);
      assert.ok(false, 'Error generating random str ' + ex);
    }
    
  });

  it('test utils', async function() {
    try {
      let req = {headers: {}};
      req.headers["x-forwarded-for"] = "49.147.91.234, 108.162.245.244";

      let ip = web.utils.getClientIp(req);
      console.log("Test IP:", ip);
      assert.ok("49.147.91.234" === ip, "Error getting client IP");
    } catch (ex) {
      console.log("Error:",ex);
      assert.ok(false, 'Error generating random str ' + ex);
    }
    
  });
 

 
});
