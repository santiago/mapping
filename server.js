/**
 * Module dependencies.
 */
var http = require('http');
var express = require('express');
var everyauth = require('everyauth');
var stylus = require('stylus');
var nib = require('nib');
var app = module.exports = express();

var env = require('./env');
app.env = env;

// WS
var server = http.createServer(app);
var ws = require('ws-rpc').extend(require('ws'));
var wss = new ws.Server({ server: server });
var ws_clients = {};
app.rpc = {
    addClient: function(id, client) {
        delete ws_clients[id];
        ws_clients[id] = client;
    },
    message: function(id, msg, args) {
        ws_clients[id].message(msg, args);
    },
    broadcast: function(msg, args) {
        wss.message(msg, args);
    }
};

wss.on('session_id', function(client, session_id) {
    app.rpc.addClient(session_id, client);
});

app.rpc.terms = require('./service/rpc/terms_rpc')(wss);

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
    this.use(express.compress());
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

// Connect to ElasticSearch and export
var esclient = (function() {
    var fork = true;
    if(fork) {
        return require('/Projects/node-elasticsearch-client');
    }
    return require('elasticsearchclient');
})();

// Initialize ES
app.es = (function() {
    var opts = {
        host: 'localhost',
        port: 9200
    };

    return new (esclient)(opts);
})();

// Connect to redis and export
app.redis = require('redis').createClient();

// Initialize Twitter API and export
app.Twitter = require('./domain/Twitter');

// Start Services
app.services = {};
['Mapping', 'Twitter', 'NocheYNiebla'].forEach(function(name) {
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
    server.listen(port, function() {
       console.log("Express server listening on port %d", port); 
    });
}
