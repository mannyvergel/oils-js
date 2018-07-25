let Book = web.models('Book');
module.exports =  {
	get : function get(req, res, next) {
		//You Mongo DB must be running for this page to work
		let isbn = '2002-71970';
		Book.findOne({isbn: isbn}, function(err, book) {
			if (!book) {
				console.log('Book %s not found. Creating a new one.', isbn);
				book = new Book();
				book.isbn = isbn;
				book.author = 'Manny Vergel';
				book.title = 'Oils JS Guide';
				book.publishDt = new Date();
				book.save();
			}

			res.render('examples/dealing-with-models.html', {book: book});
		});

		
	}
}
