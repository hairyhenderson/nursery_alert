var express = require('express');
var params = require('express-params');
var http = require('http');
var fs = require('fs');
var util = require('util');
var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var DigestStrategy = require('passport-http').DigestStrategy;

var config = require('./config.json')

var app = express();

params.extend(app);
/* istanbul ignore else */
if (app.get('env') === 'test') {
	app.set('port', 0);
} else if (app.get('env') === 'development') {
	app.set('port', process.env.PORT || 3000);
} else {
	app.set('port', 80);
}
app.use(express.favicon());
/* istanbul ignore next */
if ('development' === app.get('env')) {
	app.use(express.logger('dev'));
} else if ('test' !== app.get('env')) {
	app.use(function(req, res, next) {
		if (!/^\/alerts$/.test(req.url))
			express.logger()(req, res, next);
		else
			next();
	});
}
app.use(express.cookieParser());
app.use(express.session({
	secret: 'keboard cat'
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded());
app.use(express.json());
app.use(express.methodOverride());
app.use(app.router);

// development only
/* istanbul ignore if */
if ('development' === app.get('env')) {
	app.use(express.errorHandler());
}

/* istanbul ignore next */
passport.serializeUser(function(user, done) {
	done(null, user);
});

/* istanbul ignore next */
passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

var basic = new BasicStrategy({
	realm: 'Nursery Alert System'
}, function(username, password, next) {
	if (username === config.username && password === config.password) {
		return next(null, {
			username: username
		});
	} else {
		return next(null, false, {
			message: 'Incorrect password.'
		});
	}
});

var digest = new DigestStrategy({
	qop: 'auth',
	realm: 'Nursery Alert System'
}, function(username, next) {
	if (username === config.username) {
		return next(null, {
			username: username
		}, config.password);
	} else {
		return next(null, false, {
			message: 'Incorrect password.'
		});
	}
});

passport.use(basic);
passport.use(digest);

var setupRoutes = function(alerts) {
	app.param('code', /^[A-Z0-9]{3,4}$/);

	var self = this;

	app.get('/ping', function(req, res) {
		res.send(200, "pong.");
	});

	function auth() {
		return passport.authenticate(['digest', 'basic'], {
			session: false
		});
	}
	app.get('*', auth());
	app.put('*', auth());
	app.del('*', auth());

	app.get('/', function(req, res) {
		res.type('html');
		if (self.index) res.send(200, self.index);
		else {
			fs.readFile('index.html', {
				encoding: 'utf-8'
			}, function(err, data) {
				self.index = data;
				res.send(200, self.index);
			});
		}
	});

	app.get('/alerts', function(req, res) {
		alerts.getAll(function(obj) {
			res.json(200, obj);
		});
	});

	// This route may be unnecessary...
	app.get('/alerts/:code', function(req, res) {
		var code = req.params.code.toString();
		if (alerts.get(code)) {
			res.send(200, alerts.get(code));
		} else {
			res.send(404);
		}
	});

	app.put('/alerts/:code', function(req, res) {
		var code = req.params.code.toString();
		alerts.add(code, function() {
			res.send(201);
		});
	});

	app.del('/alerts', function(req, res) {
		alerts.clear(function() {
			res.send(204);
		});
	});

	app.del('/alerts/:code', function(req, res) {
		var code = req.params.code.toString();
		alerts.get(code, function(a) {
			if (a) {
				alerts.del(code, function() {
					res.send(204);
				});
			} else {
				res.send(404);
			}
		});
	});
};

/* istanbul ignore if */
if ('test' !== app.get('env')) {
	setupRoutes(require('./alerts'));
	app.listen(app.get('port'), function() {
		console.log('Express server listening on port ' + app.get('port'));
	});
}

module.exports = this;
module.exports.app = app;
module.exports.setupRoutes = setupRoutes;
