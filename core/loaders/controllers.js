const fileUtils = require('../utils/fileUtils.js');
const stringUtils = require('../utils/stringUtils.js');
const routeUtils = require('../utils/routeUtils.js');
module.exports = function loadControllers(web, path) {
  //let web = global.web;

  path = path || (web.conf.baseDir + web.conf.controllersDir);

  fileUtils.recurseDir(path, function loadControllerRecurseDir(err, opts) {
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
      if (controller.autoRoute !== false) {
        if (file == 'index.js') {
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