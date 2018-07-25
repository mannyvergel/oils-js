/**
Custom Routes
=============
You can create your own routing here.
This is prioritized over automatic controller routing.
**/

const routes = {

  /** Example:
  
  '/test' : function(req, res, next) { res.end('Hello World')}, //defaults to all GET, POST, DELETE, etc
  '/sample' : {
    //more specific
    get: function(req, res, next) {
      res.end('Hello Sample Get');
    },
    post: function(req, res, next) {
      res.end('Hello Sample Post');
    },
    onError: function(req, res, err, app) {
      //optional error handling
    }
  },
  '/controller-sample' : web.include('/web/src/controllers/index.js'),
  // sample regex
  '/^((?!\/static).)*$/' : {
    isRegexp: true,
    all: function(req, res, next) {
      //do stuff here like authentication
      next();
    }
  }
  */
  
  
}

module.exports = routes;