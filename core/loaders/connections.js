module.exports = function(web) {
  //var web = global.web;
	var conf = web.conf;


	if (!web.connections) {
		web.connections = [];
	}

	var showWarning = true;

	for (var i in conf.connections) {
		var dbConf = conf.connections[i];

		if (!web.connections[i]) {
			var mongoose = web.lib.mongoose;

			var url = dbConf.url;
			
			var counter = 0;
			var errFunc = function (err) {
				if (err) {
					setTimeout(function() {
						counter++;
						if (showWarning) {
							showWarning = false;
							console.warn("[Retry " + (counter) +  "] Cannot connect retrying..." + err);
							web.connections[i].close();
							setTimeout(function() {
								showWarning = true;
							}, 30000)
						}
						connect();
					}, 2000);
					
				}
			}

			var connect = function() {
				web.connections[i].open(url, {server: {poolSize: web.conf.connectionPoolSize}, replset: {poolSize: web.conf.connectionPoolSize}}, errFunc);
			}

			web.connections[i] = mongoose.createConnection();
			
			if (console.isDebug) {
			console.debug('connections.' + i + ' created.');
			}
			
			web.connections[i].on('error', errFunc);
			web.connections[i].on('open', function() {
				counter = 0;
				showWarning = true;
			});

			connect();
		}
	}

}


