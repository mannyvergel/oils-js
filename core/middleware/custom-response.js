'use strict';

const web = global.web;
const customResponse = function() {
  //TODO: may need to transfer this later (make sure it's only called once)
  web.on('beforeRender', initBeforeRender);

  return function(req, res, next) {
    req.ext = req.ext || {};

    //redirect trailing e.g. '/hello/' to '/hello' 
    if (req.url.length > 1 && req.url.charAt(req.url.length - 1) === '/') {
       res.redirect(301, req.url.slice(0, -1));
       return;
    }

    // render and renderFile transferred to Web's constructor

    next();
  }

}

module.exports = customResponse;

function initBeforeRender(view, options, callback, req, res) {
  if (!options) {
    options = {}
  }

  options['_errors'] = req.flash('error');
  options['_warns'] = req.flash('warn');
  options['_infos'] = req.flash('info');
  options['_conf'] = web.conf.viewConf;
  options['_ext'] = req.ext;

};