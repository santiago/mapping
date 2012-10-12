/**
 * Module dependencies.
 */

var express = require('express');
var everyauth = require('everyauth');
var stylus = require('stylus');
var gzippo = require('gzippo');
var app = module.exports = express.createServer();

var env= require('./env');
app.env = env;

// Configuration
function compile(str, path) {
    return stylus(str)
	.set('filename', path)
	// .set('compress', true);
}

// Start Auth
require('./lib/Auth')(app);

app.configure(function(){
    this.set('views', __dirname + '/views');
    this.set('view engine', 'jade');
    this.set('view options', { layout: 'layout' })
    this.use(express.bodyParser());
    this.use(express.logger());
    this.use(express.methodOverride());
    this.use(express.cookieParser());
    this.use(express.session({secret: 'Eah4tfzGAKhr'}));
    this.use(stylus.middleware({
	    src: __dirname + '/views'
	    , dest: __dirname + '/public'
	    , compile: compile
    }));
    this.use(express.favicon(__dirname + '/public/favicon.ico', { maxAge: 2592000000}));
    this.use(express.static(__dirname + '/public'));
    //this.use(gzippo.staticGzip(__dirname + '/public'));    
    this.use(everyauth.middleware());
    // Keep this as last one
    this.use(this.router);
});

app.configure('development', function() {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

app.get('/', function(req, res) {
	res.render('index', {
	    locals: {
		    nodes: []
	    }
	});
});

var templates = require('./templates');
app.get('/javascripts/compiled_tpls.js', function(req, res) {
    res.header('Content-Type', 'text/javascript');
    res.send(templates);
});

// Start Services
app.services = {};
['Mapping', 'Point', 'Comment'].forEach(function(name) {
    var services = require('./domain/'+name).service;
    if (!(services instanceof Array)) {
        services = [services]
    }
    services.forEach(function(s) { 
        app.services[name] = s(app);
    });
});

// Only listen on $ node app.js
if (!module.parent) {
    var port = 6660;
    app.listen(port);
    console.log("Express server listening on port %d", port)
}
