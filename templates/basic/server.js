#!/bin/env node
var Application = require('oils');

var app = new Application();

//additional server configuration if needed before starting

//var server = app.server; //express server

app.start();