'use strict';

module.exports = {
  name: 'Book',
	//mongoose schema, see mongoosejs.com for more info
	schema: {
		isbn: {type: String, index: true, unique: true},
		author: String,
		title: String,
		publishDt: Date
	}

	/*** Optional attributes

	,
	options: {
    //mongoose schema options
  },

  parentModel: '/path/to/parent/model'

	connection: 'mainDb' //defaults to 'mainDb' or the first defined connection in conf.js

	***/
}