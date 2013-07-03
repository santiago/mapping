var _ = require('underscore');
var redis = require('redis').createClient();

var TAGS = 'terms:tags'

module.exports = {

    addTags: function(term, tags, cb) {
        if(typeof tags == 'string') {
            tags = [tags]
        }
        
        redis.hget(TAGS, term, function(err, data) {
            if(data) {
                tags = _.compact(data.split(',').concat(tags));
                tags = _.uniq(tags);
            }
            redis.hset(TAGS, term, tags.join(','), cb||function() {}); 
        })
    },

    getTags: function(term, cb) {
        if(typeof term == 'string') {
            redis.hget(TAGS, term, cb);
        } else {
            if(term.length) {
                redis.hmget(TAGS, term, cb);
            }
        }
    },
    
    removeTags: function(term, tag, cb) {
        redis.hget(TAGS, term, function(err, data) {
            var tags = data.split(',');
            var index = tags.indexOf(tag);
            if(index > -1) {
                tags.splice(index, 1);
                redis.hset(TAGS, term, _.compact(tags).join(','), cb||function() {});
            }
        });
    }
};