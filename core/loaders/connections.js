'use strict';

module.exports = async function(web) {

		let conf = web.conf;

		if (!web.connections) {
			web.connections = [];
		}

		let mongoose = web.require('mongoose');

		for (let i in conf.connections) {
			let dbConf = conf.connections[i];
			dbConf.showWarning = true;

			if (!web.connections[i]) {
        let shouldRetry = true;
        while (shouldRetry) {
          try {
            console.log("Connecting to:", i, '...');

            let opts = {};
            if (web.conf.connectionPoolSize) {
              opts.maxPoolSize = web.conf.connectionPoolSize;
            }
    				web.connections[i] = mongoose.createConnection();

            // if connection always resets to 127.0.0.1 even with diff IP, check replica's .host conf
            await web.connections[i].openUri(dbConf.url, opts)

            shouldRetry = false;
          } catch (err) {
            console.warn("Retrying connection to DB because of error:", err)
          }

          await web.sleep(2000);
        }

				if (console.isDebug) {
				  console.debug('connections.' + i + ' created.');
				}
			}
		}

}



