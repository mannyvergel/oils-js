'use strict';

module.exports = function(web) {

	let conf = web.conf;


	if (!web.connections) {
		web.connections = [];
	}

	let mongoose = web.require('mongoose');

	for (let i in conf.connections) {
		let dbConf = conf.connections[i];
		dbConf.showWarning = true;

		if (!web.connections[i]) {
			
			web.connections[i] = mongoose.createConnection();
			
			if (console.isDebug) {
			  console.debug('connections.' + i + ' created.');
			}
			
			web.connections[i].on('error', getErrFunc(web, i));
			
			web.connections[i].on('open', function() {
				dbConf.counter = 0;
				dbConf.showWarning = true;
			});
			

			webConnect(web, i);
		}
	}

}

function webConnect(web, connIndex) {
	let dbConf = web.conf.connections[connIndex];
	let url = dbConf.url;
	let errFunc = getErrFunc(web, connIndex);
	web.connections[connIndex].openUri(url, {
		useNewUrlParser: true,
		poolSize: web.conf.connectionPoolSize,
		poolSize: web.conf.connectionPoolSize,
		useCreateIndex: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
	}, errFunc);
}

function getErrFunc(web, connIndex) {
	let dbConf = web.conf.connections[connIndex];
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

