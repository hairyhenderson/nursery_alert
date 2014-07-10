/* istanbul ignore next */
describe('Alerts tests', function() {
var should = require('should');
var events = require('events');
var assert = require('assert'),
    util = require('util'),
    sinon = require('sinon'),
    alerts = require('./alerts');
var cp = require('child_process');

alerts._child = {
   stdout: new events.EventEmitter(),
   on: function(msg, callback) { },
   once: function(msg, callback) { },
   send: function(msg) {} 
};
var clock;
var child;

beforeEach(function() {
   child = sinon.mock(alerts._child, "send");
	clock = sinon.useFakeTimers();
});

afterEach(function() {
   child.verify();
	clock.restore();
});

	describe('add', function() {
		it('sends an add message to the child', function(done) {
			child.expects('send').withArgs({action: 'add', code: 'FOO', starttime: 0}).once();
			alerts.add('FOO', function() {
				done();
			});
		});
	});
   describe('del', function() {
      it('sends a del message to the child', function(done) {
			child.expects('send').withArgs({action: 'del', code: 'FOO'}).once();
			alerts.del('FOO', function() {
				done();
			});
      });
   });
   describe('clear', function() {
      it('sends a clear message to the child', function(done) {
			child.expects('send').withArgs({action: 'clear'}).once();
			alerts.clear(function() {
				done();
			});
      });
   });
   describe('getAll', function() {
      it('sends a getAll message to the child, and waits for the reply message', function(done) {
         var expected = [{one:1}, {two:2}, {three:3}];
         child.expects('once').withArgs('message').yields(expected);
         child.expects('send').withArgs({action: 'getAll'}).once();

         alerts.getAll(function(as) {
            as.should.eql(expected);
            done();
         });
      });
   });
   describe('get', function() {
      it('sends a get message to the child, and waits for the reply', function(done) {
         var expected = { starttime: 123 };
         
         child.expects('once').withArgs('message').yields(expected);
         child.expects('send').withArgs({action: 'get', code: 'FOO'}).once();

         alerts.get('FOO', function(a) {
            a.should.eql(expected);
            done();
         });
      });
   });
});
