
class Plugin {
  
	constructor(conf, id) {
    this.id = id;
    this.conf = conf;
    //console.warn('INIT BASE PLUGIN');
	}

  load(pluginConf, web, next) {
    //override
    next();
  }
};

module.exports = Plugin;