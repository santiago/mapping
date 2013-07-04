var _ = require('underscore');
var redis = require('redis').createClient();

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

var terms_exclude = [
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
    "30", "40", "45", "50", "100"
];

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


    // GET /exclude
    // Show all terms excluded
    app.get('/twitter/:type/exclude', checkType, function(req, res) {
        var type = req.params.type;
        exclude(req, res, function() {
            render_terms(req, res, {
                terms: req.exclude.sort().map(function(t) { return { term: t } }),
                exc_inc: 'include'
            }, true);
        });
    });

    // POST /exclude
    // Exclude the given term
    app.post('/twitter/:type/exclude', checkType, function(req, res) {
        var term = req.body.term;
        var type = req.params.type;
        redis.sadd('exclude_'+type, term, query);

        function query(re) {
            exclude(req, res, function() {
                query(req, res, function() {
                    render_terms('includes/terms', {
                        terms: req.terms,
                        exc_inc: 'include'
                    });
                });                
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
                render_terms(req, res, { exc_inc: 'include' });
            });
        }
    });
    
    // GET /dictionary
    app.get('/twitter/dictionary', dictionary, function(req, res) {
        render_terms(req, res, {}, true);            
    });

    // GET /terms || /shingles
    app.get('/twitter/:type', checkType, search, function(req, res) {
        render_terms(req, res, {}, true);
    });

    return this;

    function exclude(req, res, next) {
        var type = req.params.type;
        var exclude = type == 'terms' ? exclude_terms : [];
        redis.smembers('exclude_'+type, function(err, r) {
            req.exclude = exclude.concat(r);
            next();
        });
    }

    function search(req, res, next) {
        exclude(req, res, function() {
            query(req, res, function() {
                es.search('analysis', 'message', req._query, function(err, data) {
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
            req._query.match[field] = {
                "query": req.query.q,
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
        var locals = _.defaults(locals, {
            tags: req.tags||[],
            session_id: req.session_id,
            terms: req.terms,
            exc_inc: 'exclude'
        });
        res.render(full ? tpl : 'includes/'+tpl, locals);
    }

    function checkSession(req, res, next) {
        if(!req.session.session_id) {
            req.session.session_id = Date.now();
        }
        req.session_id = req.session.session_id;
        next();
    }

    function dictionary(req, res, next) {
        redis.smembers('dictionary', function(err, data) {
            req.terms = data.sort().map(function(t) { return { term: t } });
            next();
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
        if(!type.match(/^(terms|shingles)$/)) {
            res.send(404);
            return;
        }
        next();
    }
};
