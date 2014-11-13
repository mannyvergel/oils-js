var Loader = require('./loader.js');
var Promise = require('es6-promise').Promise;
var fs = require('fs');

var FsLoader = Loader.extend('FsLoader', {

  load: function(path) {
    return new Promise(function(resolve, reject) {
      fs.readFile(path, function(err, data) {

        if (err) throw err;

        resolve(data);
        
      })
    })
  }
})

module.exports = FsLoader;