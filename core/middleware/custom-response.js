var web = global.web;
var customResponse = function() {
  //TODO: may need to transfer this later (make sure it's only called once)
  web.on('beforeRender', initBeforeRender)

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
        options = options || {};
        web.callEvent('beforeRender', [view, options, callback, req, res])
        _render.call(res, view, options, callback);
      };

      //obsolete, handled in engines/nunjucks
      res.renderFile = function(view, options, callback) {
        res.render.call(res, view, options, callback);
      };
      next();
    }
}

module.exports = customResponse;

function initBeforeRender(view, options, callback, req, res) {
  if (!options) {
    options = {}
  }
  //assumes middleware in Web.js
  var req = res.request;
  options['_errors'] = req.flash('error');

  options['_infos'] = req.flash('info');

};