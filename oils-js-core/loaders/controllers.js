var fileUtils = require('../utils/fileUtils');
var stringUtils = require('../utils/stringUtils');
var routeUtils = require('../utils/routeUtils');
module.exports = function(app) {
  //automatically route controllers
  setControllerRoutes(app, app.constants.CONTROLLERS_DIR);
};


function setControllerRoutes(app, dir) {
  if (app.isDebug) {
    console.debug("Scanning controllers in %s", dir);
  }
  fileUtils.recurseDir(dir, function(err, opts) {
    if (!opts.isDirectory() && stringUtils.endsWith(opts.file, '.js')) {
      var file = opts.file;
      var subfolder = opts.subfolder;
      if (app.isDebug) {
        console.debug(opts.absolutePath + '[file]');
      }
      var subPath = subfolder + '/' + file;
      var absPath = opts.absolutePath;
      var controller = require(absPath);
      
      if (controller.autoRoute !== false) {
        if (file == 'index.js') {
          var subPathWithoutExt = subPath.slice(0, -8);
          routeUtils.applyRoute(app, subPathWithoutExt, controller);

          if (opts.subfolder) {
            //for non root index.js apply no '/'
            //e.g. http://localhost/admin/ and http://localhost/admi 
            subPathWithoutExt = subPath.slice(0, -9);
            routeUtils.applyRoute(app, subPathWithoutExt, controller);
          }
          
        } else {
          var subPathWithoutExt = subPath.slice(0, -3);
          routeUtils.applyRoute(app, subPathWithoutExt, controller);
        }
        
        
      }

      
    }
  })

}