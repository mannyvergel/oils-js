'use strict';

module.exports = {
  get: async function(req, res, next) {
    console.log('Accessing', req.url);

    let myPromise = new Promise(function(resolve, reject) {
      setTimeout(function() {
        throw new Error("Some error");
      }, 500);
    });

    await myPromise;
    
  },

  onError: function(req, res, err) {
    req.flash('error', err.message);

    res.render('examples/error-handling.html');
    //you can also redirect
    //res.redirect(...);
  }
}