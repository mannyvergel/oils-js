/**
Custom Routes
=============
You can create your own routing here.
This is prioritized over automatic controller routing.
**/
var routes = {

	/** Example:
	'/' : function(req, res, next) { res.end('Hello World')}, //defaults to all GET, POST, DELETE, etc
	'/sample' : {
		//more specific
		get: function(req, res, next) {
			res.end('Hello Sample Get');
		},
		post: function(req, res, next) {
			res.end('Hello Sample Post');
		}
	},
	'/controller-sample' : includeController('/contact-us.js'), 
	'/any-js-sample' : include('/lib/sample.js')
	**/
}

module.exports = routes;