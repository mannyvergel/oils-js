'use strict';

const web = global.web;
const customResponse = function() {

  return function(req, res, next) {
    req.ext = req.ext || {};

    req.ext._backUrl = req.query._backUrl || req.body._backUrl;
    req.ext._backName = req.query._backName || req.body._backName || 'Back';

    // redirect trailing e.g. '/hello/' to '/hello' 
    // TODO: I think it's better to use '/' instead of no slash 
    // because when redirecting relative to path, it's easier, also with handling regexp /*
    // make it configurable w backwards compat
    if (req.url.length > 1 && req.url.charAt(req.url.length - 1) === '/') {
       res.redirect(301, req.url.slice(0, -1));
       return;
    }

    // render and renderFile transferred to Web's constructor

    next();
  }

}

module.exports = customResponse;