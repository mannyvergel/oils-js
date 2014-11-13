var Obj = require('../../Obj.js');

var Loader = Obj.extend('Loader',{

  load: function(path) {
    //override, can return normal object for non async, else return a Promise for async
  }
})

module.exports = Loader;