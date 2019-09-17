'use strict';

const fileUtils = require('../utils/fileUtils.js');
const stringUtils = require('../utils/stringUtils.js');
const routeUtils = require('../utils/routeUtils.js');
const path = require('path');

module.exports = function loadControllers(web, filePath) {

  filePath = filePath || path.join(web.conf.baseDir, web.conf.controllersDir);

  fileUtils.recurseDir(filePath, function loadControllerRecurseDir(err, opts) {
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
      let subPath = path.join(subfolder, file);
      let absPath = opts.absolutePath;
      let controller = null;
      try {
        controller = require(absPath);
      } catch(e) {
        console.error('Error loading ' + absPath);
        throw e;
      }
      if (controller.autoRoute !== false) {
        if (file === 'index.js') {
          let subPathWithoutExt = subPath.slice(0, -8);
          routeUtils.applyRoute(web, subPathWithoutExt, controller);

          if (opts.subfolder) {
            //for non root index.js apply no '/'
            //e.g. http://localhost/admin/ and http://localhost/admi 
            subPathWithoutExt = subPath.slice(0, -9);
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