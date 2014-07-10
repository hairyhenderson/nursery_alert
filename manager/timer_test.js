var Enumerable = require('jsclass/src/enumerable').Enumerable;
var CircularDoublyLinkedList = require('jsclass/src/linked_list').LinkedList.Doubly.Circular;

var should = require('should');
var sinon = require('sinon');
var _ = require('lodash');

describe('timer tests', function() {
	var rq;
	var timer;
	var clock;
	beforeEach(function() {
		clock = sinon.useFakeTimers(0);
		timer = require('./timer')();
		timer.activeAlerts = new CircularDoublyLinkedList();
		rq = sinon.mock(timer.request);
	});
	afterEach(function() {
		clearInterval(timer.loop);
		clearInterval(timer.checkExpired);
		rq.restore();
		//		clock.tick(120000000);
		clock.restore();
	});

	describe('alert expiry', function() {
		it('alert expires after 60 seconds', function(done) {
			rq.expects('put').once().withArgs('http://localhost:4000/AAA').yields();
			rq.expects('del').once().withArgs('http://localhost:4000').yields();

			timer.add('AAA', 0);
			timer.activeAlerts.at(0).should.have.property('code', 'AAA');
			clock.tick(61000);
			timer.activeAlerts.length.should.eql(0);
			rq.verify();
			done();
		});
		it('deleted alerts need no expiry', function(done) {
			rq.expects('put').withArgs('http://localhost:4000/AAA').yields();
			rq.expects('del').withArgs('http://localhost:4000').yields();

			timer.add('AAA', 0);
			timer.activeAlerts.at(0).should.have.property('code', 'AAA');
			clock.tick(1000);
			timer.del('AAA');
			timer.activeAlerts.length.should.be.empty;
			clock.tick(1000);
			rq.verify();
			done();
		});
	});
	describe('getAll', function() {
		it('returns empty array given no alerts', function(done) {
			timer.getAll().should.be.empty;
			done();
		});
		it('returns alert when alert added', function(done) {
			var a = {
				code: 'ABC',
				starttime: 42
			};
			timer.activeAlerts.push(_.clone(a));
			timer.getAll().should.eql([a]);
			done();
		});
	});
	describe('get', function() {
		it('returns undefined given nonexistant alert', function(done) {
			should(timer.get('foo')).be.undefined;
			done();
		});
		it('returns valid alert', function(done) {
			var a = {
				code: 'ABC',
				starttime: 42
			};
			timer.activeAlerts.push(_.clone(a));
			timer.get('ABC').should.eql(['ABC']);
			done();
		});
	});
	describe('del', function() {
		it('ignores nonexistant alert', function(done) {
			timer.del('QQQ');
			done();
		});
		it('deletes valid alert', function(done) {
			var a = {
				code: 'ABC',
				starttime: 42
			};
			timer.activeAlerts.push(_.clone(a));
			timer.del('ABC');
			should(timer.activeAlerts.at('ABC')).be.undefined;
			done();
		});
	});
	describe('display HTTP client', function() {
		it('adding an alert fires a PUT', function(done) {
			rq.expects('put').once().yields();

			timer.add('AAA', 0);
			clock.tick(1000);
			rq.verify();
			done();
		});
		it('clearing all alerts fires only one DELETE', function(done) {
			rq.expects('put').once().withArgs('http://localhost:4000/AAA').yields();
			rq.expects('del').once().yields();

			timer.add('AAA', 0);
			clock.tick(1000);
			timer.clear();
			timer.activeAlerts.length.should.be.empty;
			clock.tick(101);
			rq.verify();
			done();
		});
		it('alternates between two alerts after 5 seconds', function(done) {
			rq.expects('put').once().withArgs('http://localhost:4000/AAA').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/BBB').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/AAA').yields();

			timer.add('AAA', 0);
			// tick 10 seconds - PUT should fire once with this code
			clock.tick(10000);
			timer.add('BBB', 10000);
			// tick another 10 seconds - during this, BBB should display once and AAA should display again
			clock.tick(10000);
			rq.verify();
			done();
		});
		it('second alert stops alternating after first alert expires', function(done) {
			rq.expects('put').once().withArgs('http://localhost:4000/AAA').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/BBB').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/AAA').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/BBB').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/AAA').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/BBB').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/AAA').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/BBB').yields();
			rq.expects('del').once().withArgs('http://localhost:4000').yields();

			timer.add('AAA', 0);
			// tick 30 seconds - PUT should fire once with this code
			clock.tick(30000);
			timer.add('BBB', 30000);
			// tick another 70 seconds - during this, AAA should expire, BBB should display, 
			// then BBB should expire and the screen should clear
			clock.tick(70000);
			rq.verify();
			done();
		});
		it('if the same alert is resent after being expired, it should be redisplayed right away', function(done) {
			rq.expects('put').once().withArgs('http://localhost:4000/AAA').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/BBB').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/AAA').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/BBB').yields();
			rq.expects('del').once().withArgs('http://localhost:4000').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/BBB').yields();

			timer.add('AAA', 0);
			clock.tick(47000);
			timer.add('BBB', 47000);
			clock.tick(61000);
			timer.add('BBB', 108000);
			clock.tick(1000);
			rq.verify();
			done();
		});
		it('3 alerts are displayed in the correct order, at the correct times', function(done) {
			rq.expects('put').once().withArgs('http://localhost:4000/AAA').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/BBB').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/CCC').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/AAA').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/BBB').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/CCC').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/AAA').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/BBB').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/CCC').yields();

			timer.add('AAA', 0);
			timer.add('BBB', 0);
			timer.add('CCC', 0);
			clock.tick(40000);
			rq.verify();
			done();
		});
		it('many alerts are displayed and expired in the correct order, at the correct times', function(done) {
			for (var i = 0; i < 2; i++) {
				rq.expects('put').once().withArgs('http://localhost:4000/AAA').yields();
				rq.expects('put').once().withArgs('http://localhost:4000/BBB').yields();
				rq.expects('put').once().withArgs('http://localhost:4000/CCC').yields();
				rq.expects('put').once().withArgs('http://localhost:4000/DDD').yields();
				rq.expects('put').once().withArgs('http://localhost:4000/EEE').yields();
				rq.expects('put').once().withArgs('http://localhost:4000/FFF').yields();
			}
			rq.expects('put').once().withArgs('http://localhost:4000/BBB').yields();
			rq.expects('del').once().withArgs('http://localhost:4000').yields();

			timer.add('AAA', 0);
			clock.tick(200);
			timer.add('BBB', 200);
			timer.add('CCC', 200);
			timer.add('DDD', 200);
			clock.tick(100);
			timer.add('EEE', 300);
			timer.add('FFF', 300);
			clock.tick(90000);

			rq.verify();
			done();
		});

		it('deleting an alert doesn\'t cause next alert to be skipped', function(done) {
			rq.expects('put').once().withArgs('http://localhost:4000/AAA').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/BBB').yields();
			for (var i = 0; i < 2; i++) {
				rq.expects('put').once().withArgs('http://localhost:4000/AAA').yields();
				rq.expects('put').once().withArgs('http://localhost:4000/BBB').yields();
				rq.expects('put').once().withArgs('http://localhost:4000/CCC').yields();
			}
			rq.expects('put').once().withArgs('http://localhost:4000/DDD').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/BBB').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/CCC').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/DDD').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/BBB').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/DDD').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/CCC').yields();
			rq.expects('put').once().withArgs('http://localhost:4000/DDD').yields();
			rq.expects('del').once().withArgs('http://localhost:4000').yields();

			timer.add('AAA', 0); // x 60
			clock.tick(10000);
			timer.add('BBB', 10000); // x 70
			clock.tick(10000);
			timer.add('CCC', 20000); // x 80
			clock.tick(20000);
			timer.add('DDD', 40000); // x100
			clock.tick(5000);
			timer.del('AAA'); // 45
			clock.tick(70000);

			rq.verify();
			done();
		});
	});
});
