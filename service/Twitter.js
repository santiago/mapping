var redis = require('redis').createClient();

var ServiceBase = require('../lib/ServiceBase');

var Mapping = require('../domain/Mapping').domain;
var MappingStore = require('../domain/Mapping').store;

var esclient = (function() {
    var fork = true;
    if(fork) {
        return require('/Users/santiago/Projects/node-elasticsearch-client');
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
                "field": "text.shingles",
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


module.exports = function(app) {    
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

    function exclude(req, res, next) {
        var exclude = termsQuery.facets.blah.terms.exclude;
        redis.smembers('exclude_terms', function(err, r) {
            termsQuery.facets.blah.terms.exclude = exclude.concat(r);
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

    function query(req, res, next) {
        if(req.query.q) {
            req._query =  {
                "match": {
                   "text": {
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

    app.get('/twitter/terms', query, exclude, terms, function(req, res) {
        res.render('terms', {
            terms: req.terms
        });
    });
    
    // GET /twitter/terms/exclude
    // Show all terms excluded
    app.get('/twitter/terms/exclude', function(req, res) {
        redis.smembers('exclude_terms', function(err, data) {
            res.render('exclude', {
                terms: data.sort()
            });
        });
    });
    // POST /twitter/terms/exclude
    // Exclude the given term
    app.post('/twitter/terms/exclude', function(req, res) {
        var term = req.body.term;
        redis.sadd('exclude_terms', term, query);

        function query() {
            exclude(req, res, function() {
                terms(req, res, function() {
                    res.render('includes/terms', {
                        terms: req.terms
                    });
                });                
            });
        }
    });

    return this;
};