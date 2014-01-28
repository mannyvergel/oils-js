MODELS FOLDER
===================

All models created here are accessible via Models.[Name]. It is a Mongoose Model.

e.g.

/models/Book.js ==> models.Book

###schema [required]

Return the attributes of the schema. See Mongoose' Schema for the syntax.

###initSchema [optional]

You can initialize a Schema by adding an initSchema in your model. The Schema is a Mongoose Schema.

e.g.

```
module.exports = {
  ...

  initSchema: function(schema) {
  	//do something in schema like apply a compound index
  	schema.index({ author: 1, title: 1 }); 
  }
}
```

###connection [optional]

You can specify the connection (defined in conf.js). The default will be 'mainDb' or the first connection defined in conf.js.

```
module.exports = {
  ...

  connection: 'mainDb'
}
```