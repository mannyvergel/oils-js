var swig = require('swig');

var http = require("http")
  , response = http.ServerResponse.prototype
  , _render = response.render;

var doBeforeRender = function(res, view, options) {
  if (!options) {
    options = {}
  }
  //assumes middleware in app.js
  var req = res.request;
  options['_errors'] = req.flash('error');

  options['_infos'] = req.flash('info');


  return options;
}

response.render = function(view, options, callback) {
  options = doBeforeRender(this, view, options);
 
  _render.call(this, view, options, callback);
};


response.renderFile = function(view, options, callback) {
    var self = this;
    options = doBeforeRender(this, view, options);
    swig.renderFile(global.BASE_DIR + view, options, function(err, str) {
      self.end(str);
    });
};