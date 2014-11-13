module.exports = {
  get : function(req, res, next) {
    res.render('examples/controller-verbs.html');
  },
  post: function(req, res, next) {
    res.end('post function');

  },
  put: function(req, res, next) {
    res.end('put function');
  },
  delete: function(req, res, next) {
    res.end('delete function');
  },
  options: function(req, res, next) {
    res.end('options function');
  },
  /* you could also use 'all' for all verbs
  all: function(req, res, next) {
    res.render('examples/controller-verbs');
  }

  */
}