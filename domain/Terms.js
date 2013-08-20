var _ = require('underscore');
var redis = require('redis').createClient();

var TAGS = 'terms:tags';
var TERMS = 'tags:terms';

var api;
module.exports = api = {
    getExclude: function(mode, cb) {
        redis.smembers('exclude_'+mode, function(err, r) {
            cb(null, r);
        });
    },

    updateTags: function(term, tags, cb) {
        if(typeof tags == 'string') {
            tags = [tags]
        }
        api.addTerms(term, tags, api.addTags.bind(this, term, tags));
    },

    // Add terms to one tag
    addTerms: function(term, tags, cb) {
        tags.forEach(function(t) {
            redis.hmget(TERMS, tags, function(err, data) {
                var terms = {};
                data.forEach(function(_terms, i) {
                    _terms = _terms||'';
                    var tag = tags[i]; 
                    terms[tag] = _.compact(_terms.split(','));
                    terms[tag].push(term);
                    terms[tag] = _.uniq(terms[tag]).join(',');
                });
                redis.hmset(TERMS, terms, cb);
            });
        });
    },
    // Add tags to one term
    addTags: function(term, tags, cb) {
        redis.hget(TAGS, term, function(err, data) {
            if(data) {
                tags = _.compact(data.split(',').concat(tags));
                tags = _.uniq(tags);
            }
            redis.hset(TAGS, term, tags.join(','), cb||function() {}); 
        })
    },

    getAllTags: function(cb) {
        redis.hkeys(TERMS, cb);
    },
    
    getTags: function(term, cb) {
        if(typeof term == 'string') {
            redis.hget(TAGS, term, cb);
        } else {
            if(term.length) {
                redis.hmget(TAGS, term, function(err, tags) {
                    var _tags = {};
                    tags.forEach(function(t, i) {
                        _tags[term[i]] = t ? t.split(',') : t;
                    });
                    cb(null, _tags);
                });
            }
        }
    },
    
    removeTags: function(term, tag, cb) {
        redis.hget(TAGS, term, function(err, data) {
            var _tags = data.split(',');
            var index = _tags.indexOf(tag);
            if(index > -1) {
                _tags.splice(index, 1);
                _tags = _.compact(_tags).join(',');
                redis.hset(TAGS, term, _tags, function() {
                    api.removeTerm(term, tag, cb||function() {});
                });
            }
        });
    },
    
    // Get terms for a tag
    getTerms: function(tag, cb) {
        redis.hget(TERMS, tag, function(err, data) {
            cb(null, data.split(','));
        });
    },

    // Remove a term from a tag
    removeTerm: function(term, tags, cb) {
        if(typeof tags == 'string') {
            tags = [tags];
        }
        redis.hmget(TERMS, tags, function(err, data) {
            var _terms = {};
            data.forEach(function(terms, i) {
                var tag = tags[i];
                _terms[tag] = (terms||'').split(',');
                var index = _terms[tag].indexOf(term);
                if(index > -1) {
                    _terms[tag].splice(index, 1)
                }
            });
            redis.hmset(TERMS, _terms, cb);
        });
    }
};