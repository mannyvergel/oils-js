'use strict';

module.exports = {
	get : function(req, res, next) {
		
		res.render('index.html');
		//res.end('HELLO WORLD!');
	}
}

/** Another sample

module.exports =  function(req, res) {
	res.end('Hello World');
}

**/