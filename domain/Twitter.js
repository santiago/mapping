// Connect to ElasticSearch and export
var esclient = (function() {
    var fork = true;
    if(fork) {
        return require('/Projects/node-elasticsearch-client');
    }
    return require('elasticsearchclient');
})();

// Initialize ES
var es = (function() {
    var opts = {
        host: 'localhost',
        port: 9200
    };

    return new (esclient)(opts);
})();

// Connect to redis and export
var redis = require('redis').createClient();

var _ = require('underscore');

module.exports = (function() {
    var ntwitter = require('ntwitter');

    function addFollowing(data, cb) {
        if(_.isArray(data)) {
            var users = data;
        } else {
            var users = [data];
        }

        users.forEach(function(user) {
            var profile = _.pick(user, ['screen_name', 'name', 'time_zone', 'profile_image_url', 'followers_count', 'description', 'id_str', 'location']);
            redis.hmset('stream:following:'+user.id_str, profile, function() {
                redis.hset('stream:following:users', user.id_str, user.screen_name, cb);
            });
        });
    }
    
    function TwitterAPI() {
        console.log(require('../twitter/account'));
        this.api = new ntwitter(require('../twitter/account'));
    }

    TwitterAPI.prototype.follow = function(user, cb) {
        this.api.createFriendship(user, function(err, data) {
            if(!err) {
                es.index('twitter', 'user', data, function() {
                    
                });
                addFollowing(data, function() {
                    cb(true);
                });
            } else {
                console.log(err);
                cb(false);
            }
        });
    };
    
    // Syncs friends in twitter with our internal listing
    TwitterAPI.prototype.syncFollowing = function(user, cb) {
        var api = this.api;

        this.api.getFriendsIds(user, function(err, data) {
            usersLookup(data);
        });
        
        function usersLookup(ids) {
            var lookupIds = ids.splice(0, 100);
            api.lookupUsers(lookupIds, function(err, data) {
                addFollowing(data, function() {
                    if(ids.length) {
                        usersLookup(ids);
                    } else {
                        cb(data);
                    }
                });
            });
        }
    };

    return new TwitterAPI();
})();