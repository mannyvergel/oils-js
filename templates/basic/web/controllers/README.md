CONTROLLERS FOLDER
==================

Controllers are automatically routed by Oils js. And index.js is equal to the root folder.

So 
/web/controllers/index.js => http://localhost:8080/
/web/controllers/contact-us.js => http://localhost:8080/contact-us
/web/controllers/folder1/test1.js => http://localhost:8080/folder1/test1.js

You can override all routes in /conf/routes.js

You can also disallow routing of controllers by defining its autoRoute option.
E.g.

```
module.exports =  {
	autoRoute: false,
	route: '/my-custom-route',//override autoroute path
	
	get : function(req, res) {
		...
	},

	onError: function(req, res, err, app) {
		//error handling
	}
}
```