module.exports = {
	//mongoose schema, see mongoosejs.com for more info
	schema: {
		author: String,
		title: String,
		publishDate: Date
	}

	/*** Optional attributes

	,
	initSchema: function(schema) {
		//initialize the schema if needed, else this
		//methos is optional
	},

	connection: 'mainDb' //defaults to 'mainDb' or the first defined connection in conf.js

	***/
}