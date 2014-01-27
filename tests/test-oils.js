//nodeunit
global.isTest = true;
var app = require('../oils-js-core');
exports['Check Attributes'] = function(test) {
	test.ok(app.conf, 'Configuration loaded.');
	test.ok(app.connections != null, 'Connections loaded');
	test.ok(app.models != null, 'Models loaded');

	test.done();
}

exports['Check Globals'] = function(test) {
	test.ok(global.oils != null, 'Check global.oils');
	test.ok(global.connections != null, 'Check global.connections');
	test.ok(global.models != null, 'Check global.models');
	test.done();
}

var mongoose = require('mongoose');

exports.tearDown = function(ok) {
	

	mongoose.disconnect(function(err) {
		
	})

	
	ok();
}