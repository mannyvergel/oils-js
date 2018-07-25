const nunjucks = require('nunjucks');
const path = require('path');

module.exports = function DefaultTemplateEngine(web, templatesPath) {
  let CustomFileSystemLoader = require('./filesystem.custom.js');
  //let env = nunjucks.configure(templatesPath, {autoescape: true, express: web.app});
  let env = new nunjucks.Environment(new CustomFileSystemLoader(templatesPath, {noCache: web.conf.isDebug}), {autoescape: true});
  env.express(web.app)

  env.extendNunjucks = function(env) {
  	//extend nunjucks
  	require('./nunjucks.ext.js')(env);
  }

  env.extendNunjucks(env);

  return env;
}

