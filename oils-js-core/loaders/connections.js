module.exports = function(app) {
	var conf = app.conf;


	if (!app.connections) {
		app.connections = [];
	}

	var showLog = true;

	for (var i in conf.connections) {
		var dbConf = conf.connections[i];

		if (!app.connections[i]) {
			var mongoose = require('mongoose');

			var url = dbConf.url;
			
			var counter = 0;
			var errFunc = function (err) {
				if (err) {
					setTimeout(function() {
						counter++;
						if (showLog) {
							showLog = false;
							console.error("[Retry " + (counter) +  "] Cannot connect retrying..." + err);
							app.connections[i].close();
							setTimeout(function() {
								showLog = true;
							}, 30000)
						}
						connect();
					}, 2000);
					
				}
			}

			var connect = function() {
				app.connections[i].open(url, errFunc);
			}

			app.connections[i] = mongoose.createConnection();
      if (app.isDebug) {
        console.log('connections.' + i + ' created.');
      }
			
			app.connections[i].on('error', errFunc);
			app.connections[i].on('open', function() {
				counter = 0;
				showLog = true;
			});

			connect();
		}
	}

}


