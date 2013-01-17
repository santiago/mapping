/**
 * Module dependencies.
 */

var express = require('express');
var everyauth = require('everyauth');
var stylus = require('stylus');
var nib = require('nib');
var app = module.exports = express();

var env = require('./env');
app.env = env;

// Configuration
function compile(str, path) {
    return stylus(str)
	.set('filename', path)
	.set('compress', true)
    .use(nib())
}

// Start Auth
require('./lib/Auth')(app);

app.configure(function() {
    this.set('views', __dirname + '/views');
    this.set('view engine', 'jade');
    
    // bodyParser without multipart
    this.use(express.json());
    this.use(express.urlencoded());
 
    this.use(express.logger());
    this.use(express.methodOverride());
    this.use(express.cookieParser('Eah4tfzGAKhr'));
    this.use(express.session());
    this.use(stylus.middleware({
	    src: __dirname + '/views', 
        dest: __dirname + '/public', 
        compile: compile
    }));
    this.use(express.favicon(__dirname + '/public/favicon.ico', { maxAge: 2592000000 }));
    this.use(express.static(__dirname + '/public'));

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
		    nodes: [],
            everyauth: req.session.auth||{}
	    }
    );
});

var templates = require('./templates');
app.get('/javascripts/compiled_tpls.js', function(req, res) {
    res.header('Content-Type', 'text/javascript');
    res.send(templates);
});

// Start Services
app.services = {};
['Mapping'].forEach(function(name) {
    var services = require('./service/'+name);
    if (!(services instanceof Array)) {
        services = [services]
    }
    services.forEach(function(s) {
        app.services[name] = s(app);
    });
});

// require('./lib/Upload')

// Only listen on $ node app.js
if (!module.parent) {
    var port = 6660;
    app.listen(port);
    console.log("Express server listening on port %d", port)
}
