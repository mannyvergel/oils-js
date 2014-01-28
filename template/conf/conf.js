/*
 Global variables:
 global.isProd - checks if running in openshift server, will expose this later
 connections.mainDb - main mongoose db, convenience for oils.connections.mainDb
 models.[model name] - returns a Mongoose Model, convenience for oils.models
 oils.isDebug - setting to true usually means more logging

 configuration below is accessible view oils.conf.[name]
 e.g. oils.conf.ipAddress
*/

module.exports = {
	ipAddress: process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1',
	port: process.env.OPENSHIFT_NODEJS_PORT || 8080,
	connections: {
		//only mongoose connections are support for now
		//you can specify multiple connections and specify the connection in your model.
		//if you don't need a db, you can remove/comment out mainDb
		mainDb : {
			url: (process.env.OPENSHIFT_MONGODB_DB_URL + process.env.OPENSHIFT_APP_NAME) || 'mongodb://localhost/test'
		}
	},
	isDebug: false
}

