module.exports = function TwitterService(app) {
    var redis = app.redis,
        es = app.es,
        _ = require('underscore');
    
    // Domain
    var Terms = require('../domain/Terms');
    var Analysis = new (require('../domain/Analysis'))('stream', 'message');
    
    // Service helpers
    var stream = require('./stream_helpers')(app);

    app.get('*', checkSession);
    
    app.get('/twitter', function(req, res) {
        res.render('twitter', {
            everyauth: {}
        });
    });
    
    app.get('/twitter/municipios', function(req, res) {
        redis.hgetall('municipios:location', function(err, data) {
            var locations = Object.keys(data).map(function(muni) {
                return data[muni].split(',').map(function(n) { return parseFloat(n) }).reverse();
            });
            res.send(
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "MultiPoint",
                        "coordinates": locations
                    },
                    "properties": {
                        "name": "Municipios de Colombia"
                    }
                }
            );
        });
    });


    // GET /exclude
    // Show all terms excluded
    app.get('/twitter/:mode/exclude', checkMode, function(req, res) {
        var mode = req.params.mode;
        Terms.getExclude(mode, function(err, exclude) {
            render_terms(req, res, {
                terms: exclude.sort().map(function(t) { return { term: t } }),
                actions: ['include']
            }, true);
        });
    });

    // POST /exclude
    // Exclude the given term
    app.post('/twitter/:mode/exclude', checkMode, function(req, res) {
        var term = req.body.term;
        var mode = req.params.mode;
        redis.sadd('exclude_'+mode, term, function() {
            res.send({ ok: true });
        });
    });

    // DELETE /exclude
    // Delete term from exclude list
    app.del('/twitter/:mode/exclude', checkMode, function(req, res) {
        var term = req.body.term;
        var mode = req.params.mode;
        redis.del('exclude_'+mode, term, function() {
            res.send({ ok: true})
        });
    });
    
    // GET /dictionary
    app.get('/twitter/dictionary', dictionary, function(req, res) {
        render_terms(req, res, {}, true);            
    });

    // GET /:mode/search
    app.get('/twitter/:mode/search', checkMode, search, function(req, res) {
        render_terms(req, res, {});
    });

    // GET /stream
    app.get('/twitter/stream', stream.following, function(req, res) {
        render_stream(req, res, {}, true);
    });
    
    // GET /stream/trending
    app.get('/twitter/stream/trending', stream.trending, function(req, res) {
        render_terms(req, res, {});
    });
    
    // GET /stream/analysis
    app.get('/twitter/stream/analysis', stream.analysis, function(req, res) {
        render_terms(req, res, {});
    });
    
    // GET /stream/following
    app.get('/twitter/stream/following', stream.following, stream.users, getTags, function(req, res) {
        res.render('includes/following', { 
            users: req.users,
            type: null,
            tags: req.tags || null,
            following: req.following.map(function(t) { return t.toLowerCase() }),
            session_id: req.session_id
        });
    });
    
    // POST /stream/following/sync
    app.post('/twitter/stream/sync', stream.syncFollowing, function(req, res) {
        res.send({ ok: true });
    });

    // POST /stream/follow
    app.post('/twitter/stream/follow', stream.follow, function(req, res) {
        res.send({ ok: true });
    });
    
    // GET /:mode
    app.get('/twitter/:mode', checkMode, search, function(req, res) {
        render_terms(req, res, {}, true);
    });
    
    return this;

    function search(req, res, next) {
        var mode = req.params.mode;
        Analysis[mode](req.query.q||null, function(err, result) {
            req.terms = result;
            next();
        });
    }

    function render_terms(req, res, locals, full) {
        full = full || false;
        var tpl = 'terms';
        var mode = req.params.mode;

        var _locals = _.defaults(locals || {}, {
            mode: mode,
            tags: true || null,
            session_id: req.session_id,
            terms: req.terms,
            actions: ['exclude']
        });

        res.render(full ? tpl : 'includes/'+tpl, _locals);
    }

    function render_stream(req, res, locals) {
        var _locals = _.defaults(locals || {}, {
            mode: null,
            tags: req.tags || null,
            session_id: req.session_id,
            terms: req.terms,
            actions: ['follow']
        });
        res.render('stream', _locals);
    }

    function checkSession(req, res, next) {
        if(!req.session.session_id) {
            req.session.session_id = Date.now();
        }
        req.session_id = req.session.session_id;
        next();
    }

    function dictionary(req, res, next) {
        var query = {
            "query": {
                "match_all": {}
            },
            "facets": {
                "dictionary": {
                    "terms": {
                        "field": "term",
                        "size": "7000"
                    },
                }                
            }
        };

        es.search('analysis', 'message', query, function(err, data) {
            req.terms = JSON.parse(data).facets.dictionary.terms;
            render_terms(req, res, {}, true);
        });
    }

    function getTags(req, res, next) {
        var terms = req.terms.map(function(t) { return t.term });
        Terms.getTags(terms, function(err, tags) {
            req.tags = tags;
            next();
        });
    }

    function checkMode(req, res, next) {
        var mode = req.params.mode;
        if(!mode.match(/^(terms|shingles)$/)) {
            res.send(404);
            return;
        }
        next();
    }
};