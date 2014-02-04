var fileUtils = require('../utils/fileUtils.js');
var fs = require('fs');
var pluginsLoader = function(app) {
  app.plugins = new Object();
  if (app.isDebug) {
    console.log("Scanning plugins in %s", app.constants.PLUGINS_DIR);
  }
  var arrFiles = fileUtils.readRootDirOnlySync(app.constants.PLUGINS_DIR);
  for (var i in arrFiles) {
    var file = arrFiles[i];

    handleFile(app, file);
  }

  if (app.isDebug) {
    console.log('Done reading plugins directory.');
  }
}

function handleFile(app, file) {
  var absolutePath = global.BASE_DIR + app.constants.PLUGINS_DIR + '/' + file;
  var stat = fs.statSync(absolutePath);
  
  if (stat && stat.isDirectory()) {

    var pluginConf = getPluginConf(absolutePath);
    var pluginName = file; //later might get from conf
    if ( typeof pluginConf.oils === 'undefined' ) {
      throw new Error('"oils" property not found in package.json of plugin: ' + pluginName);
    }
    if ( typeof pluginConf.oils.enabled === 'undefined' ) {
      throw new Error('"oils.enabled" property not found in package.json of plugin: ' + pluginName);
    }
    if (pluginConf.oils.enabled) {
      if (app.isDebug) {
        console.log('[plugin] %s', pluginName);
      }

      var myPlugin = require(absolutePath);
      
      app.plugins[pluginName] = new myPlugin(pluginConf,app);
    } else {
      if (app.isDebug) {
        console.log('Plugin %s is NOT enabled. Skipping.', pluginName);
      }
    }
  }
  
}

function getPluginConf(dir) {
  var conf = require(dir + '/package.json');

  return conf;
}


module.exports  = pluginsLoader;