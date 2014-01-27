MODELS FOLDER
===================

All models created here are accessible via Models.[Name]. It is a Mongoose Model.

e.g.

/models/Book.js ==> models.Book

You can initialize a Schema by adding an initSchema in your model. The Schema is a Mongoose Schema.

e.g.

module.exports = {
  schema: {
    author: String,
    title: String,
    publishDate: Date
  },

  initSchema: function(schema) {
  	//do something in schema like apply a compound index
  	schema.index({ author: 1, title: 1 }); 
  }
}