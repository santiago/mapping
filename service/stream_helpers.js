module.exports = function(app) {
    var _ = require('underscore');
    var redis = app.redis;
    var es = app.es;
    var Twitter = app.Twitter;

    var Terms = require('../domain/Terms');
    var Analysis = new (require('../domain/Analysis'))('stream', 'message');

    return {
        follow: follow,
        following: following,
        users: users,
        syncFollowing: syncFollowing,
        trending: trending,
        analysis: analysis,
        segmentation: segmentation
    };
    
    function segmentation(req, res, next) {
        Terms.getAllTags(function(err, tags) {
            req.tags = tags;
            if(req.query.tag) {
                Terms.getTerms(req.query.tag, function(err, data) {
                    req.taggedSet = data;
                    Analysis.segmentation(req.query, function(err, terms) {
                        req.terms = terms;
                        next(); 
                    });
                });
            } else {
                next();    
            }
        });
    }
    
    function following(req, res, next) {
        redis.hvals('stream:following:users', function(err, data) {
            req.following = data;
            next();
        });
    }
    
    function users(req, res, next) {
        redis.hkeys('stream:following:users', function(err, data) {
            req.users = [];
            getNextUser();
            function getNextUser() {
                var id = data.shift();
                if(!id) {
                    // We need terms for getting tags
                    req.terms = req.users.map(function(u) {
                        return { term: u.screen_name.toLowerCase() }
                    });
                    req.users = _.sortBy(req.users, function(u) {
                        return u.screen_name;
                    });
                    next();
                    return;
                }
                redis.hgetall('stream:following:'+id, function(err, user) {
                    req.users.push(user);
                    getNextUser();
                });
            }
        })
    }
    
    function syncFollowing(req, res, next) {
        Twitter.syncFollowing('AnalizaColombia', function(list) {
            next();
        });
    }
    
    function trending(req, res, next) {
        var query = {
            "query": {
                "match_all": {}
            },
            "facets": {
                "mentions": {
                    "terms": {
                        "field": "entities.user_mentions.screen_name",
                        "size": "1000"
                    }
                }
            }
        };
        
        es.search('twitter', 'tweet', query, function(err, data) {
            req.terms = JSON.parse(data).facets.mentions.terms;
            next();
        });
    }
    
    function links(req, res, next) {
        var query = {
            "query": {
                "match_all": {}
            },
            "facets": {
                "mentions": {
                    "terms": {
                        "field": "entities.user_mentions.screen_name",
                        "size": "1000"
                    }
                }
            }
        };
        
        es.search('twitter', 'tweet', query, function(err, data) {
            req.terms = JSON.parse(data).facets.mentions.terms;
            next();
        });
    }
    
    // Creates a friendship
    function follow(req, res, next) {
        Twitter.follow(req.body.user, function() {
            next();
        });
    }
    
    function analysis(req, res, next) {
        var mode = req.params.mode||'shingles';
        var q = req.query.q || null;

        Analysis[mode](q, function(err, result) {
            req.terms = result;
            next();
        });
    }
};