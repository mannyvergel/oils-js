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
    if (pluginConf.enabled) {
      if (app.isDebug) {
        console.log('[plugin] %s', pluginName);
      }
      
      app.plugins[pluginName] = require(absolutePath);
    } else {
      if (app.isDebug) {
        console.log('Plugin %s is NOT enabled. Skipping.', pluginName);
      }
    }
  }
  
}

function getPluginConf(dir) {
  var conf = require(dir + '/conf.js');

  return conf;
}


module.exports  = pluginsLoader;