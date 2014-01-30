var Book = models.Book;
module.exports =  {
	get : function(req, res) {
		
		res.render('index');
		//res.end('HELLO WORLD!');
	}
}

/** Another sample

module.exports =  function(req, res) {
	res.end('Hello World');
}

**/