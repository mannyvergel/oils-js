
module.exports = function(web) {
  //var web = global.web;
	var conf = web.conf;


	if (!web.connections) {
		web.connections = [];
	}

	

	for (var i in conf.connections) {
		var dbConf = conf.connections[i];
		dbConf.showWarning = true;

		if (!web.connections[i]) {
			var mongoose = web.lib.mongoose;

			//var url = dbConf.url;
			
			// var connect = function() {
			// 	web.connections[i].open(url, {server: {poolSize: web.conf.connectionPoolSize}, replset: {poolSize: web.conf.connectionPoolSize}}, errFunc);
			// }

			web.connections[i] = mongoose.createConnection();
			
			if (console.isDebug) {
			  console.debug('connections.' + i + ' created.');
			}
			
			web.connections[i].on('error', getErrFunc(web, i));

			(function(dbConf) {
				web.connections[i].on('open', function() {
					dbConf.counter = 0;
					dbConf.showWarning = true;
				});
			})(dbConf)
			

			webConnect(web, i);
		}
	}

}

function webConnect(web, connIndex) {
	var dbConf = web.conf.connections[connIndex];
	var url = dbConf.url;
	var errFunc = getErrFunc(web, connIndex);
	web.connections[connIndex].openUri(url, {useNewUrlParser: true, poolSize: web.conf.connectionPoolSize, poolSize: web.conf.connectionPoolSize}, errFunc);
}

function getErrFunc(web, connIndex) {
	var dbConf = web.conf.connections[connIndex];
	if (!dbConf.counter) {
		dbConf.counter = 1;
	}
	return function(err) {
		if (err) {
			setTimeout(function() {
				
				if (dbConf.showWarning) {
					dbConf.showWarning = false;
					console.warn("[Retry " + (dbConf.counter) +  "] Cannot connect retrying..." + err);
					web.connections[connIndex].close();
					setTimeout(function() {
						dbConf.showWarning = true;
					}, 30000)
				}
				webConnect(web, connIndex);
				dbConf.counter += 1;
			}, 2000);
			
		}
	}
}

