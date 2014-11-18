
var Plugin = require('../Plugin.js');
module.exports = function Plugins(web) {

  for (var i in web.conf.plugins) {
    var pluginConf = web.conf.plugins[i];
    if (pluginConf.enabled) {

      var pluginPath;
      if (pluginConf.pluginPath) {
        pluginPath = pluginConf.pluginPath;
      } else {
        pluginPath = '/node_modules/' + i;
      }

      pluginConf.pluginPath = pluginPath;
      if (console.isDebug) {
        console.debug('Adding plugin: ' + pluginPath);
      }
      var plugin = require(web.conf.baseDir + pluginPath);
      try {
        var pluginObj = null;
        if (!plugin.load) {
          pluginObj = Plugin.extend({
            load: plugin
          });
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
