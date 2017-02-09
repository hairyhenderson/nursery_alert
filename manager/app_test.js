var should = require('should')
require('should-http')
var assert = require('assert'),
	request = require('request'),
	a = require('./app'),
	http = require('http'),
	util = require('util'),
	fs = require('fs'),
	sinon = require('sinon'),
	alerts = require('./alerts-mem');

var USER = 'user';
var PASS = 'follow';

var baseUrl;
var index;
var createServer = function(done) {
	a.setupRoutes(alerts);

	var server = http.createServer(a.app);
	server.listen(0, function() {
		var addr = server.address();
		/* istanbul ignore next */
		if (addr.address === '0.0.0.0' || addr.address === '::') {
			baseUrl = 'http://localhost:' + addr.port;
		} else {
			baseUrl = 'http://' + addr.address + ':' + addr.port;
		}
		console.log("Server listening at " + baseUrl);
		fs.readFile('index.html', {
			encoding: 'utf-8'
		}, function(err, data) {
			index = data;
			done();
		});
	});
};

/* istanbul ignore next */
describe('Nursery Alerter - HTTP Interface Tests', function() {
	before(function(done) {
		createServer(done);
	});
	beforeEach(function(done) {
		alerts.clear(done);
	});

	afterEach(function() {});

	describe('GET /ping', function() {
		it('replies without needing authentication', function(done) {
			request.get(baseUrl + '/ping', function(err, res, body) {
				should(err).not.exist;
				res.should.have.status(200);
				res.should.be.text;
				body.should.eql('pong.');
				done();
			});
		});
	});

	describe('authentication', function() {
		it('is required on all non-/ping routes', function(done) {
			request.get(baseUrl + '/', function(err, res, body) {
				res.should.have.status(401);
				done();
			});
		});
		it('rejects incorrect username with Basic', function(done) {
			request.get(baseUrl + '/', function(err, res, body) {
				res.should.have.status(401);
				done();
			}).auth('foo', PASS, true);
		});
		it('rejects incorrect username with Digest', function(done) {
			request.get(baseUrl + '/', function(err, res, body) {
				res.should.have.status(401);
				done();
			}).auth('foo', PASS, false);
		});
		it('rejects incorrect password', function(done) {
			request.get(baseUrl + '/', function(err, res, body) {
				res.should.have.status(401);
				done();
			}).auth(USER, 'swordfish');
		});
		it('supports Basic auth', function(done) {
			request.get(baseUrl + '/', function(err, res, body) {
				res.should.have.status(200);
				done();
			}).auth(USER, PASS, true);
		});
		it('supports Digest auth', function(done) {
			request.get(baseUrl + '/', function(err, res, body) {
				res.should.have.status(200);
				done();
			}).auth(USER, PASS, false);
		});
	});
	describe('GET /', function() {
		it('should reply with the index page', function(done) {
			request.get(baseUrl + '/', function(error, response, body) {
				should(error).not.exist;
				response.should.have.status(200);
				response.should.be.html;
				body.should.eql(index);
				done();
			}).auth(USER, PASS);
		});
	});
	describe('GET /alerts - dummy alerts', function() {
		beforeEach(function() {
			alerts.add("ABCD");
		});

		afterEach(function() {
			//alerts.getAll.restore();
		});

		it('should reply with a list of current alerts', function(done) {
			request.get(baseUrl + '/alerts', function(err, res, body) {
				res.should.have.status(200);
				res.should.be.json;
				JSON.parse(body).should.have.property("ABCD");
				done();
			}).auth(USER, PASS);
		});
	});
	describe('GET /alerts - no alerts', function() {
		beforeEach(function() {});
		afterEach(function() {});
		it('should reply with an empty JSON list', function(done) {
			request.get(baseUrl + '/alerts', function(error, response, body) {
				response.should.have.status(200);
				response.should.be.json;
				JSON.parse(body).should.eql({});
				done();
			}).auth(USER, PASS);
		});
	});
	describe('GET /alerts/:code', function() {
		var clock = null;
		beforeEach(function() {
			clock = sinon.useFakeTimers(0);
			clock.tick(12345);
			alerts.add("A2A3");
			clock.restore();
		});
		afterEach(function() {});

		it('should reject codes longer than 4 characters', function(done) {
			request.get(baseUrl + '/alerts/AAAAA', function(error, response, body) {
				response.should.have.status(404);
				done();
			}).auth(USER, PASS);
		});
		it('should return the requested code', function(done) {
			request.get(baseUrl + '/alerts/A2A3', {
				json: true
			}, function(error, response, body) {
				response.should.have.status(200);
				response.should.be.json;
				body.should.eql({
					starttime: 12345
				});
				done();
			}).auth(USER, PASS);
		});
		it('returns 404 for nonexistant code', function(done) {
			request.get(baseUrl + '/alerts/BBBB', {
				json: true
			}, function(err, res, body) {
				res.should.have.status(404);
				done();
			}).auth(USER, PASS);
		});
	});

	describe('PUT /alerts/:code', function() {
		beforeEach(function() {});

		afterEach(function() {});

		it('creates a new alert', function(done) {
			request.put(baseUrl + '/alerts/1234', function(error, response, body) {
				response.should.have.status(201);
				alerts.get('1234').should.exist;
				done();
			}).auth(USER, PASS);
		});
		it('errors given a bad code format', function(done) {
			request.put(baseUrl + '/alerts/bogus', function(err, res, body) {
				res.should.have.status(404);
				done();
			}).auth(USER, PASS);
		});
	});

	describe('DELETE /alerts/:code', function() {
		beforeEach(function() {});

		afterEach(function() {});

		it('cancels an alert', function(done) {
			alerts.add("FOO2");

			request.del(baseUrl + '/alerts/FOO2', function(error, response, body) {
				response.should.have.status(204);
				alerts.getAll().should.eql({});
				done();
			}).auth(USER, PASS);
		});
		it('returns 404 given an unknown code', function(done) {
			request.del(baseUrl + '/alerts/BLAB', function(error, response, body) {
				response.should.have.status(404);
				done();
			}).auth(USER, PASS);
		});
	});
	describe('DELETE /alerts', function() {
		beforeEach(function(done) {
			alerts.add('FOO1');
			alerts.add('BAR2');
			alerts.add('BAZ3', done);
		});
		it('cancels all alerts', function(done) {
			request.del(baseUrl + '/alerts', function(error, response, body) {
				response.should.have.status(204);
				alerts.getAll().should.eql({});
				done();
			}).auth(USER, PASS);
		});
		it('behaves the same when there are no alerts', function(done) {
			alerts.clear();
			request.del(baseUrl + '/alerts', function(err, res, body) {
				res.should.have.status(204);
				alerts.getAll().should.eql({});
				done();
			}).auth(USER, PASS);
		});
	});
});

module.exports = this;
