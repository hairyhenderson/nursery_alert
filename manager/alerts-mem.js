/** in-memory implementation - for testing! */
var codes = {};
this.add = function(code, callback) {
	codes[code] = {
		starttime: Date.now()
	};
	if (callback) callback();
};
this.getAll = function(callback) {
	if (callback) return callback(codes);
	return codes;
};
this.get = function(code, callback) {
	if (callback) return callback(codes[code]);
	return codes[code];
};
this.del = function(code, callback) {
	delete codes[code];
	callback();
};
this.clear = function(callback) {
	codes = {};
	if (callback) callback();
};

module.exports = this;
