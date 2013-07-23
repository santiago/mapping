module.exports = function TwitterService(app) {
    var redis = app.redis,
        es = app.es,
        _ = require('underscore');
    
    // Domain
    var Terms = require('../domain/Terms');
    var exclude_terms = Terms.exclude_terms;
    
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
    app.get('/twitter/:type/exclude', checkType, function(req, res) {
        exclude(req, res, function() {
            render_terms(req, res, {
                terms: req.exclude.sort().map(function(t) { return { term: t } }),
                actions: ['include']
            }, true);
        });
    });

    // POST /exclude
    // Exclude the given term
    app.post('/twitter/:type/exclude', checkType, function(req, res) {
        var term = req.body.term;
        var type = req.params.type;
        redis.sadd('exclude_'+type, term, _search);

        function _search() {
            search(req, res, function() {
                render_terms(req, res);
            });
        }
    });

    // DELETE /exclude
    // Delete term from exclude list
    app.del('/twitter/:type/exclude', checkType, function(req, res) {
        var term = req.body.term;
        var type = req.params.type;
        redis.del('exclude_'+type, term, query);

        function query() {
            exclude(req, res, function() {
                render_terms(req, res, { actions: ['include'] });
            });
        }
    });
    
    // GET /dictionary
    app.get('/twitter/dictionary', dictionary, function(req, res) {
        render_terms(req, res, {}, true);            
    });

    // GET /:type/search
    app.get('/twitter/:type/search', checkType, search, function(req, res) {
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
    app.get('/twitter/stream/analysis', stream.analysis, stream.users, getTags, function(req, res) {
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
    
    // GET /:type
    app.get('/twitter/:type', checkType, search, function(req, res) {
        render_terms(req, res, {}, true);
    });
    
    return this;

    function exclude(req, res, next) {
        var type = req.params.type;
        var excluded = type == 'terms' ? exclude_terms : [];
        redis.smembers('exclude_'+type, function(err, r) {
            req.exclude = excluded.concat(r);
            next();
        });
    }

    function search(req, res, next) {
        exclude(req, res, function() {
            query(req, res, function() {
                es.search('geo', 'message', req._query, function(err, data) {
                    req.terms = JSON.parse(data).facets.blah.terms;
                    getTags(req, res, next);
                });
            });
        });
    }

    function query(req, res, next) {
        var type = req.params.type;
        var field = "text."+type;

        req._query = {
            "query": {
                "match": {
                }
            },
            "facets": {
                "blah": {
                    "terms": {
                        "field": field,
                        "exclude": req.exclude,
                        "size": "400"
                    }
                }
            }
        };

        if(req.query.q) {
            req._query.query.match[field] = {
                "query": decodeURI(req.query.q),
                "operator" : "and"
            };
        } else {
            req._query.query= { "match_all": {} }
        }

        next();
    }

    function render_terms(req, res, locals, full) {
        full = full || false;
        var tpl = 'terms';
        var type = req.params.type;

        var _locals = _.defaults(locals || {}, {
            type: type,
            tags: req.tags || null,
            session_id: req.session_id,
            terms: req.terms,
            actions: ['exclude']
        });

        res.render(full ? tpl : 'includes/'+tpl, _locals);
    }

    function render_stream(req, res, locals) {
        var _locals = _.defaults(locals || {}, {
            type: null,
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
        var terms = req.terms.map(function(t) {
            return t.term;
        });

        Terms.getTags(terms, function(err, tags) {
            req.tags = {};
            terms.forEach(function(t, i) {
                if(tags[i]) {
                    req.tags[t] = tags[i];
                }
            });
            next();
        });
    }

    function checkType(req, res, next) {
        var type = req.params.type;
        if(!type.match(/^(terms|shingles)$/)) {
            res.send(404);
            return;
        }
        next();
    }
};