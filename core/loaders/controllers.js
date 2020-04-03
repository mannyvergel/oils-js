'use strict';

const fileUtils = require('../utils/fileUtils.js');
const stringUtils = require('../utils/stringUtils.js');
const routeUtils = require('../utils/routeUtils.js');
const path = require('path');

module.exports = async function loadControllers(web, filePath) {

  filePath = filePath || path.join(web.conf.baseDir, web.conf.controllersDir);

  await fileUtils.handleEachFromDir(filePath, {}, async function controllerFileHandler(err, opts) {
    if (err) {
      console.warn("Error loading controllers::", err);
      return;
    }

    if (!opts.isDirectory() && stringUtils.endsWith(opts.file, '.js') && !fileUtils.isHidden(opts.file)) {
      let file = opts.file;
      let subfolder = opts.subfolder;
      if (console.isDebug) {
        console.debug(opts.absolutePath + '[file]');
      }
      let subPath = subfolder + '/' + file;
      let absPath = opts.absolutePath;
      let controller = null;
      try {
        controller = require(absPath);
      } catch(e) {
        console.error('Error loading ' + absPath);
        throw e;
      }

      if (controller.route) {
        let routesToApply = web.objectUtils.isArray(controller.route) ? controller.route : [controller.route];

        for (let route of routesToApply) {
           routeUtils.applyRoute(web, route, controller);
        }
      } else if (controller.autoRoute !== false) {
        if (file === 'index.js') {
          
          if (opts.subfolder) {
            // for non root index.js remove the last '/'
            // e.g. http://localhost/test/ to http://localhost/test 
            // since we always redirect to non '/'
            let subPathWithoutExt = subPath.slice(0, -9);
            routeUtils.applyRoute(web, subPathWithoutExt, controller);
          } else {
            let subPathWithoutExt = subPath.slice(0, -8);
            routeUtils.applyRoute(web, subPathWithoutExt, controller);
          }
          
        } else {
          let subPathWithoutExt = subPath.slice(0, -3);

          routeUtils.applyRoute(web, subPathWithoutExt, controller);
        } 
        
      }
      
    }
  });
}