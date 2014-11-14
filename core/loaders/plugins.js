module.exports = function Plugins(web) {

  for (var i in web.conf.plugins) {
    var pluginConf = web.conf.plugins[i];
    if (pluginConf.enabled != "N") {

      var pluginPath = web.conf.baseDir + '/node_modules/' + i;
      if (console.isDebug) {
        console.debug('Adding plugin: ' + pluginPath);
      }

      try {
        var pluginObj = require(pluginPath);
        web.addPlugin(pluginObj);
      } catch (e) {
        console.error('Problem adding plugin: ' + i + '. Make sure it is found in node_modules directory.');
      }
    }
  }
}


// var fileUtils = require('../utils/fileUtils.js');
// var fs = require('fs');
// var pluginsLoader = function(web) {

//   var pluginsDir = web.conf.baseDir + web.conf.pluginsDir;
//   //web.plugins = new Object();
//   if (console.isDebug) {
//     console.debug("Scanning plugins in %s", pluginsDir);
//   }
//   var arrFiles = fileUtils.readRootDirOnlySync(pluginsDir);
//   for (var i in arrFiles) {
//     var file = arrFiles[i];

//     handleFile(pluginsDir, web, file);
//   }

//   if (console.isDebug) {
//     console.debug('Done reading plugins directory.');
//   }
// }

// function handleFile(pluginsDir, web, file) {
//   var absolutePath = pluginsDir + '/' + file;
//   var stat = fs.statSync(absolutePath);
  
//   if (stat && stat.isDirectory()) {

//     var pluginConf = getPluginConf(absolutePath);
//     var pluginName = pluginConf.name;

//     var SomePlugin = require(absolutePath);

//     web.addPlugin(SomePlugin);

    

//     // if ( typeof pluginConf.oils === 'undefined' ) {
//     //   throw new Error('"oils" property not found in package.json of plugin: ' + pluginName);
//     // }
//     // if ( typeof pluginConf.oils.enabled === 'undefined' ) {
//     //   throw new Error('"oils.enabled" property not found in package.json of plugin: ' + pluginName);
//     // }
//     // if (pluginConf.oils.enabled) {
//     //   if (console.isDebug) {
//     //     console.debug('[plugin] %s', pluginName);
//     //   }

//     //   var myPlugin = require(absolutePath);
      
//     //   //web.plugins[pluginName] = new myPlugin(pluginConf,web);
//     //   //web.plugins[pluginName].conf = pluginConf;
//     // } else {
//     //   if (web.isDebug) {
//     //     console.debug('Plugin %s is NOT enabled. Skipping.', pluginName);
//     //   }
//     // }
//   }
  
// }

// function getPluginConf(dir) {
//   var conf = require(dir + '/package.json');

//   return conf;
// }


// module.exports  = pluginsLoader;