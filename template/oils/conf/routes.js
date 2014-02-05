/**
Custom Routes
=============
You can create your own routing here.
This is prioritized over automatic controller routing.
**/
var routes = {

	/** Example:
  
	'/test' : function(req, res, next) { res.end('Hello World')}, //defaults to all GET, POST, DELETE, etc
	'/sample' : {
		//more specific
		get: function(req, res, next) {
			res.end('Hello Sample Get');
		},
		post: function(req, res, next) {
			res.end('Hello Sample Post');
		}
	},
	'/controller-sample' : includeController('/index.js'), 
	'/any-js-sample' : include('/web/controllers/index.js'),
	// sample regex
  '/^((?!\/static).)*$/' : {
    isRegexp: true,
    all: function(req, res, next) {
      //do stuff here like authentication
      next();
    }
  }
  
  */
}

module.exports = routes;