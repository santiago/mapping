var redis = require('redis').createClient();

var app = module.parent;

var ServiceBase = require('../lib/ServiceBase');

var Mapping = require('../domain/Mapping').domain;
var Terms = require('../domain/Terms');
var MappingStore = require('../domain/Mapping').store;

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

var termsQuery = {
    "size": "1000",
    "query": {
        "match": {
            "text": {
                "query": "colombia mexico",
                "operator" : "and"
            }
        }
    },
    "facets": {
        "blah": {
            "terms": {
                "field": "text.terms",
                "exclude": [
                    "htt", "http", "https", "ca", "co", "com", "amps", "em", "lts3", "xd", "eu",
                    "dias", "yo", "rt", "san", "mas", "si", "via", "vs", "av", "vez", "pa", "toda", "pues", "dice", "despues", "paso", "ahora", "ver", "quiero", "tambien", "gente", "da", "mejor", "todas", "creo", "mismo", "tras", "cerca", "hacia", "cada", "medio", "alguien", "primer", "primera", "aun", "muchas", "vos", "mientras", "alla", "ganas", "nadie", "super", "igual", "camino", "proximo", "ultimo", "veces", "ex", "nombre", "persona", "mejor", "mejores", "servicio", "minuto", "cara", "seria", "km", "ja", "lado", "meses", "puerta", "jaja", "jajaja", "vista", "pasado", "entrada", "casi", "sos", "fecha", "claro", "jajajajaja", "cosas", "pronto", "punto", "mes", "caso", "mil", "minutos", "saludo", "sector", "cuenta", "pais", "buenas", "ayer", "nunca", "hola", "buen", "dos", "buenos", "jajajaja", "bueno", "saludos", "personas", "buena", "unico", "junto", "alto", "bajo", "altura", "mayor", "segun", "mano", "alta", "horas", "tres",
                    "i", "the", "at", "to", "my", "it", "with", "and", "this", "so", "do", "be", "others", "that", "of", "in", "on", "you", "for", "is", "as", "from", "am", "up", "get", "all", "out", "go", "can", "are", "i'm", "we", "by", "have", "just", "will", "your", "but", "was", "one", "not", "if", "show", "now", "time", "what", "today", "haha", "when", "city", "an", "live", "don't", "or", "can't", "back", "it's", "here", "about", "country", "know", "good", "class", "photo",
                    "favor", "ano", "anos", "va", "asi", "hoy", "bien", "aqui", "tan", "momento", "ahi", "aca", "sino", "acabo", "ah", "luego", "more", "day", "june", 
                    "", "lt", "gt", "gts", "na", "pm", "nao", "um", "ta", "pra", "uma", "re", "cc", "mais", "il", "et", "ma", "je", "eh", "sis", "ht", "per", "sa", "amp",
                    "voy", "hacer", "hace", "ser", "di", "estan", "sera", "ir", "vamos", "espero", "tener", "vi", "viene", "quiere", "van", "puede", "dijo", "deja", "sigue", "falta", "decir", "pasa", "ve", "esperamos", "queda", "tenia", "visita", "parece", "vas", "sabe", "llega", "dio", "debe", "gusta", "recuerdo", "sale", "puedo", "come", "dar", "perdio", "retiro", "mira", "vive", "llego", "hizo", "gana", "sabes", "espera", "vivir", "esperando", "veo", "vale", "saber", "pueden", "llama", "puedes", "dicen", "haciendo", "estara", "quieres", "dormir", "llegar", "une", "viendo", "tratar",
                    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j",
                    "k", "l", "m", "n", "o", "p", "q", "r", "s", "t",
                    "u", "v", "w", "x", "q", "z",
                    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", 
                    "00", "01", "06", "000",
                    "10", "11", "12", "13", "14", "15", "16", "17", "18", "19",
                    "20", "21", "22", "23", "25", "29",
                    "30", "40", "45", "50", "100", 
                    "て", "の", "い", "か", "た", "し", "な", "っ", "の", "と", "す", "ん", "は", "る", "う", "ま", "に", "ら", "お", "こ", "り", "よ", "さ", "く", "き", "あ", "も", "れ", "け", "や", "ち"
                ],
                "size": "400"
            }
        }
    }
};

var shinglesQuery = {
    "size": "1000",
    "query": {
        "match_all": {}
    },
    "facets": {
        "blah": {
            "terms": {
                "field": "text.shingles",
                "size": "400"
                /*"script": {
                    "script": "term.match(new RegExp(regex, 'i')) ? false : true",
                    "lang": "js",
                    "params": {
                        "regex": "(.)(1|2|3|a|en|yo|tu|ti|tus|ellos|nos|su|sus|por|en|de|del|el|le|la|lo|las|los|les|con|no|y|t|que|me|para|da|san|mi|un|una|te|es|esa|ese|esos|esta|este|estos|estas|ya|se|como|to|be|the|si|ya)"
                    }
                }*/
            }
        }
    }
};

module.exports = function(app) {    
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

    app.get('/twitter/terms', query, exclude_terms, terms, getTags, function(req, res) {
        res.render('terms', {
            tags: req.tags,
            session_id: req.session_id,
            terms: req.terms,
            exc_inc: 'exclude'
        });
    });

    app.get('/twitter/shingles', query, exclude_shingles, shingles, getTags, function(req, res) {
        res.render('terms', {
            tags: req.tags,
            session_id: req.session_id,
            terms: req.terms,
            exc_inc: 'exclude'
        });
    });

    // GET /twitter/terms/exclude
    // Show all terms excluded
    app.get('/twitter/terms/exclude', function(req, res) {
        redis.smembers('exclude_terms', function(err, data) {
            res.render('exclude', {
                session_id: req.session_id,
                terms: data.sort(),
                exc_inc: 'include'
            });
        });
    });
    // POST /twitter/terms/exclude
    // Exclude the given term
    app.post('/twitter/terms/exclude', function(req, res) {
        var term = req.body.term;
        redis.sadd('exclude_terms', term, query);

        function query() {
            exclude_terms(req, res, function() {
                terms(req, res, function() {
                    res.render('includes/terms', {
                        terms: req.terms,
                        exc_inc: 'exclude'
                    });
                });                
            });
        }
    });

    // GET /twitter/shingles/exclude
    // Show all shingles excluded
    app.get('/twitter/shingles/exclude', function(req, res) {
        redis.smembers('exclude_shingles', function(err, data) {
            res.render('terms', {
                terms: data.sort().map(function(t) { return { term: t } }),
                exc_inc: 'include'
            });
        });
    });
    // POST /twitter/shingles/exclude
    // Exclude the given shingle
    app.post('/twitter/shingles/exclude', function(req, res) {
        var term = req.body.term;
        redis.sadd('exclude_shingles', term, query);

        function query() {
            shinglesWithTags(req, res, function() {
                res.render('includes/terms', {
                    tags: req.tags,
                    terms: req.terms,
                    exc_inc: 'exclude'
                });
            });                
        }
    });

    // DELETE /twitter/shingles/exclude
    // Delete shingle from exclude listings
    app.del('/twitter/shingles/exclude', function(req, res) {
        var term = req.body.term;
        redis.srem('exclude_shingles', term, query);

        function query() {
            redis.smembers('exclude_shingles', function(err, data) {
                res.render('includes/terms', {
                    terms: data.sort().map(function(t) { return { term: t } }),
                    exc_inc: 'include'
                });
            });
        }
    });
    
    // GET /twitter/dictionary
    app.get('/twitter/dictionary', dictionary, function(req, res) {
        res.render('terms', {
            terms: req.terms,
            exc_inc: 'exclude'
        });            
    });

    return this;
    
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
    
    function dictionary(req, res, next) {
        redis.smembers('dictionary', function(err, data) {
            req.terms = data.sort().map(function(t) { return { term: t } });
            next();
        });
    }

    function exclude_terms(req, res, next) {
        var exclude = termsQuery.facets.blah.terms.exclude;
        redis.smembers('exclude_terms', function(err, r) {
            termsQuery.facets.blah.terms.exclude = exclude.concat(r);
            next();
        });
    }

    function exclude_shingles(req, res, next) {
        var exclude = []; //= termsQuery.facets.blah.terms.exclude;
        redis.smembers('exclude_shingles', function(err, r) {
            shinglesQuery.facets.blah.terms.exclude = exclude.concat(r);
            next();
        });
    }

    function terms(req, res, next) {
        termsQuery.query = req._query;
        termsQuery.size = req.query.size || "1000";

        es.search('analysis', 'message', termsQuery, function(err, data) {
            req.terms = JSON.parse(data).facets.blah.terms;
            next();
        });
    }

    function shingles(req, res, next) {
        termsQuery.query = req._query;
        termsQuery.size = req.query.size || "1000";
        es.search('analysis', 'message', shinglesQuery, function(err, data) {
            req.terms = JSON.parse(data).facets.blah.terms;
            next();
        });
    }

    function query(req, res, next) {
        if(req.query.q) {
            req._query =  {
                "match": {
                   "text.terms": {
                        "query": req.query.q,
                        "operator" : "and"
                    }
                }
            }
        } else {
            req._query = { "match_all": {} }
        }
        next();
    }

    function checkSession(req, res, next) {
        if(!req.session.session_id) {
            req.session.session_id = Date.now();
        }
        req.session_id = req.session.session_id;
        next();
    }
    
    function shinglesWithTags(req, res, next) {
        exclude_shingles(req, res, function() {
            shingles(req, res, function() {
                getTags(req, res, next);
            })
        });
    }
};
