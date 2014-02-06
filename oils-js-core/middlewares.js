exports.responsePatch = function(app) {
  return function(req, res, next) {
      res.request = req;

      var _render = res.render;

      
      //override res.render
      res.render = function(view, options, callback) {
        options = beforeRender(req, res, view, options, callback);
        app.execEvent('beforeRender', [view, options, callback])
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