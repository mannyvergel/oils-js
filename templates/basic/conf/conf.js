/**
 configuration below is accessible view web.conf.[name]
 e.g. web.conf.ipAddress
*/

var conf = {
  ipAddress: '0.0.0.0',
  port: 8080,
  connections: {
    //only mongoose connections are support for now
    //you can specify multiple connections and specify the connection in your model.
    //if you don't need a db, you can remove/comment out mainDb
    mainDb : {
      url: 'mongodb://localhost:27017/oils'
    }
  },
  connectionPoolSize: 5,
  enableCsrfToken: true,
  secretPassphrase: 'as9vjas5209ja0w9utq90gjf0a9sj',
  isDebug: (process.env.NODE_ENV != 'production'),
  plugins: {
    //add your plugins in package.js and declare it here e.g.
    //'oils-plugin-basic': {
    //  enabled: true  
    //  //override plugin configurations  
    //} 
  }
}

module.exports = conf;