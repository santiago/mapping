module.exports = function(app) {
    var redis = app.redis;
    var es = app.es;
    var Twitter = app.Twitter;

    var Analysis = new (require('../domain/Analysis'))('stream', 'message');

    return {
        follow: follow,
        following: following,
        users: users,
        syncFollowing: syncFollowing,
        trending: trending,
        analysis: analysis
    };
    
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
                    req.terms = req.users.map(function(u) {
                        return { term: u.screen_name.toLowerCase() }
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
            console.log(result);
            req.terms = result;
            next();
        });
    }
};