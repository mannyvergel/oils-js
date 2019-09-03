
const Plugin = require('../Plugin.js');
module.exports = function Plugins(web) {

  for (let i in web.conf.plugins) {
    let pluginConf = web.conf.plugins[i];
    if (pluginConf.enabled) {

      let pluginPath;
      if (pluginConf.pluginPath) {
        pluginPath = pluginConf.pluginPath;
      } else {
        pluginPath = '/node_modules/' + i;
      }

      pluginConf.pluginPath = pluginPath;
      if (console.isDebug) {
        console.debug('Adding plugin: ' + pluginPath);
      }
      let plugin = require(web.conf.baseDir + pluginPath);
      try {
        let pluginObj = null;
        if (!plugin.load) {
          pluginObj = class extends Plugin {};
          pluginObj.prototype.load = plugin;
        } else {
          pluginObj = plugin;
        }
        
        web.addPlugin(new pluginObj(pluginConf, i));
      } catch (e) {
        console.error('Problem adding plugin: ' + i + '. ' + e);
        if (console.isDebug) {
          throw e;
        }
      }
    }
  }
}
