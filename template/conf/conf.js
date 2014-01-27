/*
 Global variables:
 global.isProd - checks if running in openshift server
 connections.mainDb - main mongoose db, convenience for oils.connections.mainDb
 models.[model name] - returns a Mongoose Model, convenience for oils.models
 oils.isDebug - setting to true usually means more logging
*/

module.exports = {
	ipAddress: process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1',
	port: process.env.OPENSHIFT_NODEJS_PORT || 8080,
	connections: {
		//later support for multiple mongoose databases
		mainDb : {
			url: (process.env.OPENSHIFT_MONGODB_DB_URL + process.env.OPENSHIFT_APP_NAME) || 'mongodb://localhost/test'
		}
	},
	debug: false
}

