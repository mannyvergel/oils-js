var Book = models.Book;
module.exports =  {
	get : function(req, res) {
		
		var book = new Book();
		book.title = "Oils JS";
		book.author = "Manny Vergel"
		res.render('index.html', {book: book});
		//res.end('HELLO WORLD!');
	}
}
