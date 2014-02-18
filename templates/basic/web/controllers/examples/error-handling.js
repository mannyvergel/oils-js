module.exports = {
  get: function(req, res, next) {
    throw new Error('Hello Error!');
  },

  onError: function(req, res, err) {
    req.flash('error', err.message);

    res.render('examples/error-handling.html');
    //you can also redirect
    //res.redirect(...);
  }
}