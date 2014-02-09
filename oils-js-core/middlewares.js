exports.responsePatch = function(app) {
  return function(req, res, next) {

      //redirect trailing e.g. '/hello/' to '/hello' 
      if (req.url.substr(-1) == '/' && req.url.length > 1) {
         res.redirect(301, req.url.slice(0, -1));
         return;
      }

      res.request = req;

      var _render = res.render;

      
      //override res.render
      res.render = function(view, options, callback) {
        options = beforeRender(req, res, view, options, callback);
        app.callEvent('beforeRender', [view, options, callback, req, res])
        _render.call(res, view, options, callback);
      };

      res.renderFile = function(view, options, callback) {
        res.render.call(res, global.BASE_DIR + view, options, callback);
      };
      next();
    }
}

function beforeRender(req, res, view, options, callback) {
  if (!options) {
    options = {}
  }
  //assumes middleware in app.js
  var req = res.request;
  options['_errors'] = req.flash('error');

  options['_infos'] = req.flash('info');
  return options;
};