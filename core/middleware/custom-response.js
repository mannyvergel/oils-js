const web = global.web;
const customResponse = function() {
  //TODO: may need to transfer this later (make sure it's only called once)
  web.on('beforeRender', initBeforeRender)

  return function(req, res, next) {

      //redirect trailing e.g. '/hello/' to '/hello' 
      if (req.url.substr(-1) == '/' && req.url.length > 1) {
         res.redirect(301, req.url.slice(0, -1));
         return;
      }

      let _render = res.render;
      
      //override res.render
      res.render = function(view, options, callback) {
        options = options || {};
        web.callEvent('beforeRender', [view, options, callback, req, res])
        _render.call(res, view, options, callback);
      };

      
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

  options['_errors'] = req.flash('error');
  options['_infos'] = req.flash('info');
  options['_conf'] = web.conf.viewConf;

};