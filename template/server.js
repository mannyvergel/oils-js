#!/bin/env node
var Application = require('oils');

var app = new Application();

//additional server configuration if needed before starting

//var server = app.server; //express server

app.start();



//so the server won't stop when there's an exception
//you can remove this if needed.
process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
  if (err) {
    console.error(err.stack);
  }
});