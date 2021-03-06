'use strict';

module.exports = {
  get: async function(req, res, next) {
    console.log('Accessing', req.url);

    let myPromise = new Promise(function(resolve, reject) {
      setTimeout(function() {
        resolve("My async return data");
      }, 2000);
    });

    let data = await myPromise;
      
    res.render('examples/async.html', {myAsyncData: data});

    console.log('End of ', req.url);
  }
}