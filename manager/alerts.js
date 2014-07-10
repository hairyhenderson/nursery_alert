/** HTTP client implementation */
var request = require('request');
var cp = require('child_process');
var self = this;

// This is the timer worker that actually makes the various display
// requests to the running python webserver
this._child;
/* istanbul ignore next */
this.getChild = function() {
	if (self._child) return self._child;
	self._child = cp.fork('timer.js');
	self._child.on('exit', function(code, signal) {
		console.log('timer exited with ' + code + '. respawning.');
		self._child = cp.fork('timer.js');
	});
	return self._child;
};

this.add = function(code, callback) {
	var m = {
		action: 'add',
		code: code,
		starttime: Date.now()
	};
	self.getChild().send(m);
	callback();
};
this.getAll = function(callback) {
	var m = {
		action: 'getAll'
	};
	self.getChild().once('message', function(alerts) {
		return callback(alerts);
	});
	self.getChild().send(m);
};
this.get = function(code, callback) {
	var m = {
		action: 'get',
		code: code
	};
	self.getChild().once('message', function(a) {
		return callback(a);
	});
	self.getChild().send(m);
};
this.del = function(code, callback) {
	var m = {
		action: 'del',
		code: code
	};
	self.getChild().send(m);
	callback();
};
this.clear = function(callback) {
	var m = {
		action: 'clear'
	};
	self.getChild().send(m);
	callback();
};

module.exports = this;
