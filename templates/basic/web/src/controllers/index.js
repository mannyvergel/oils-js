'use strict';

module.exports = {
	get : function(req, res, next) {
		res.render('index.html');
	},

  post: function(req, res, next) {
    res.send("OK");
  }
}

/** Another sample

module.exports =  function(req, res) {
	res.end('Hello World');
}

**/