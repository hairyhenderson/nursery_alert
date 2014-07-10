var util = require('util');
var Enumerable = require('jsclass/src/enumerable').Enumerable;
var CircularDoublyLinkedList = require('jsclass/src/linked_list').LinkedList.Doubly.Circular;
var _ = require('lodash');

/**
 * A worker to be forked from the main app. Waits for messages from alerts.js
 * and sends HTTP requests to the Python/pygame part of the script.
 * This is where all the waiting happens!
 */
module.exports = function() {
	var self = this;
	this.request = require('request');

	var PORT = 4000;
	var URL = 'http://localhost:' + PORT;

	this.activeAlerts = new CircularDoublyLinkedList();

	var lastshowntime = 0;
	var single = true;
	var current;
	var showing;

	/**
	 * m is supposed to be structured like this:
	 * {
	 *  action: "add", // add/del/clear
	 *  code:   "XYZ", // required for add/del
	 *  starttime:  12345  // the start time of the alert - required if code is set
	 * }
	 */
	/* istanbul ignore if */
	if (process.env.NODE_ENV !== 'test') {
		process.on('message', function(m) {
			switch (m.action) {
				case "add":
					self.add(m.code, m.starttime);
					break;
				case "del":
					self.del(m.code);
					break;
				case "clear":
					self.clear();
					break;
				case "get":
					process.send(self.get(m.code));
					break;
				case "getAll":
					process.send(self.getAll());
					break;
			}
		});
	}

	this.getAll = function() {
		var all = [];
		self.activeAlerts.forEach(function(entry) {
			// all[entry.code] = { starttime: entry.starttime };
			all.push({
				code: entry.code,
				starttime: entry.starttime
			});
		});
		return all;
	};
	this.get = function(code) {
		var item = self.activeAlerts.map('code');
		return item;
	};
	this.add = function(code, starttime) {
		var obj = {
			code: code,
			starttime: starttime
		};

		if (self.activeAlerts.length === 0) {
			self.activeAlerts.push(obj);

			current = self.activeAlerts.first;
			show();
		} else {
			single = false;
			self.activeAlerts.push(obj);
		}
	};
	this.del = function(code) {
		var node = null;
		self.activeAlerts.forEach(function(item) {
			if (item.code == code) node = item;
		});
		if (current === node) current = current.next;
		if (node)
			self.activeAlerts.remove(node);

		if (self.activeAlerts.length === 0) self.clear();
		else if (self.activeAlerts.length === 1) single = true;

		if (delayExpired()) {
			show();
		} else {
			setTimeout(show, 5000 - (Date.now() - lastshowntime));
		}
	};

	this.clear = function() {
		single = true;
		current = undefined;
		self.activeAlerts = new CircularDoublyLinkedList();
		self.request.del(URL, function(err, res, body) {});
	}

	this.checkExpired = setInterval(function() {
		self.activeAlerts.forEach(function(node) {
			if (node.starttime <= Date.now() - 60000)
				self.del(node.code);
		});
	}, 100);
	/* istanbul ignore else */
	if (this.checkExpired.unref) this.checkExpired.unref();

	this.loop = setInterval(function() {
		if (delayExpired()) {
			if (current) current = current.next;
			if (self.activeAlerts.length > 0 && !single) {
				show();
			}
		}
	}, 100);
	/* istanbul ignore else */
	if (this.loop.unref) this.loop.unref();

	var delayExpired = function() {
		return lastshowntime <= Date.now() - 5000;
	};

	var show = function() {
		if (current && showing != current) {
			self.request.put(URL + '/' + current.code, function(err, res, body) {});
			showing = current;
			lastshowntime = Date.now();
		}
	};

	return this;
};

/* istanbul ignore if */
if (process.env.NODE_ENV !== 'test') {
	module.exports();
}
