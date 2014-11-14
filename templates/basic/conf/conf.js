/**
 configuration below is accessible view web.conf.[name]
 e.g. web.conf.ipAddress
*/

var conf = {
  ipAddress: process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1',
  port: process.env.OPENSHIFT_NODEJS_PORT || 8080,
  connections: {
    //only mongoose connections are support for now
    //you can specify multiple connections and specify the connection in your model.
    //if you don't need a db, you can remove/comment out mainDb
    mainDb : {
      url: (process.env.OPENSHIFT_MONGODB_DB_URL + process.env.OPENSHIFT_APP_NAME) || 'mongodb://localhost/oils'
    }
  },
  isDebug: false,
  plugins: {
    //add your plugins in package.js and declare it here e.g.
    //'oils-plugin-basic': {
    //  enabled: true  
    //  //override plugin configurations  
    //} 
  }
}

module.exports = conf;