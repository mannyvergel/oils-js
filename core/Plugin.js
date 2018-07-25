const Obj = require('./Obj.js');

const Plugin = Obj.extend('Plugin', {
  
	init: function(conf, id) {
    this.id = id;
    this.conf = conf;
    //console.warn('INIT BASE PLUGIN');
	},

  load: function(pluginConf, web, next) {
    //override
    next();
  }
});

module.exports = Plugin;