var Book = models.Book;
module.exports =  {
	get : function(req, res) {
		
		var book = new Book();
		book.title = "Oils JS";
		book.author = "Manny Vergel"
		res.render('index', {book: book});
		//res.end('HELLO WORLD!');
	}
}

/** Another sample

module.exports =  function(req, res) {
	res.end('Hello World');
}

**/