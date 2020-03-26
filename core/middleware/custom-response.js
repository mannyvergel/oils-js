'use strict';

const web = global.web;
const customResponse = function() {

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