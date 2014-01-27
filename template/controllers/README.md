CONTROLLERS FOLDER
==================

Controllers are automatically routed by Oils js. And index.js is equal to the root folder.

So 
/controllers/index.js => http://localhost:8080/
/controllers/contact-us.js => http://localhost:8080/contact-us
/controllers/folder1/test1.js => http://localhost:8080/folder1/test1.js

You can override all routes in /conf/routes.js

You can also disallow routing of controllers by defining its autoRoute option.
E.g.

```
var Book = models.Book;
module.exports =  {
	autoRoute: false,
	
	get : function(req, res) {
		
		var book = new Book();
		book.title = "Oils JS";
		book.author = "Manny Vergel"
		res.render('index.html', {book: book});
		//res.end('HELLO WORLD!');
	}
}
```