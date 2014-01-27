module.exports = function(app) {
	var server = app.server;
	//custom routes or if you want to override routes of controllers e.g.
	//server.get('/', function(req, res, next) { res.end('Hello World')});
	/***
	  custom routes or if you want to override routes of controllers e.g.
	  server.get('/', function(req, res, next) { res.end('Hello World')});

	  or if you want a custom route to a controller
	  
	  var controller = include('/controllers/contact-us.js');
	  server.get('/about', controller.get);
	***/
}

