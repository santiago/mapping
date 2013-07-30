var redis = require('redis').createClient();
var _ = require('underscore');
var Terms = require('./Terms');
var es = require('./Search');
    
function search(mode, q, cb) {
    Terms.getExclude(mode, function(err, exclude) {
        var _query = query(mode, q, exclude);
        console.log(_query);
        es.search(this.index, this.type, _query, function(err, data) {
            console.log(err);
            console.log(data);
            getTags(JSON.parse(data).facets.blah.terms, cb);
        });
    }.bind(this));
}

function query(mode, q, exclude) {
    var field = "text."+mode;

    var exclude_base = [
        "htt", "http", "https", "ca", "co", "com", "amps", "em", "lts3", "xd", "eu",
        "dias", "yo", "rt", "san", "mas", "si", "via", "vs", "av", "vez", "pa", "toda", "pues", "dice", "despues", "paso", "ahora", "ver", "quiero", "tambien", "gente", "da", "mejor", "todas", "creo", "mismo", "tras", "cerca", "hacia", "cada", "medio", "alguien", "primer", "primera", "aun", "muchas", "vos", "mientras", "alla", "ganas", "nadie", "super", "igual", "camino", "proximo", "ultimo", "veces", "ex", "nombre", "persona", "mejor", "mejores", "servicio", "minuto", "cara", "seria", "km", "ja", "lado", "meses", "puerta", "jaja", "jajaja", "vista", "pasado", "entrada", "casi", "sos", "fecha", "claro", "jajajajaja", "cosas", "pronto", "punto", "mes", "caso", "mil", "minutos", "saludo", "sector", "cuenta", "pais", "buenas", "ayer", "nunca", "hola", "buen", "dos", "buenos", "jajajaja", "bueno", "saludos", "personas", "buena", "unico", "junto", "alto", "bajo", "altura", "mayor", "segun", "mano", "alta", "horas", "tres",
        "i", "the", "at", "to", "my", "it", "with", "and", "this", "so", "do", "be", "others", "that", "of", "in", "on", "you", "for", "is", "as", "from", "am", "up", "get", "all", "out", "go", "can", "are", "i'm", "we", "by", "have", "just", "will", "your", "but", "was", "one", "not", "if", "show", "now", "time", "what", "today", "haha", "when", "city", "an", "live", "don't", "or", "can't", "back", "it's", "here", "about", "country", "know", "good", "class", "photo",
        "favor", "ano", "anos", "va", "asi", "hoy", "bien", "aqui", "tan", "momento", "ahi", "aca", "sino", "acabo", "ah", "luego", "more", "day", "june", 
        "", "lt", "gt", "gts", "na", "pm", "nao", "um", "ta", "pra", "uma", "re", "cc", "mais", "il", "et", "ma", "je", "eh", "sis", "ht", "per", "sa", "amp",
        "voy", "hacer", "hace", "ser", "di", "estan", "sera", "ir", "vamos", "espero", "tener", "vi", "viene", "quiere", "van", "puede", "dijo", "deja", "sigue", "falta", "decir", "pasa", "ve", "esperamos", "queda", "tenia", "visita", "parece", "vas", "sabe", "llega", "dio", "debe", "gusta", "recuerdo", "sale", "puedo", "come", "dar", "perdio", "retiro", "mira", "vive", "llego", "hizo", "gana", "sabes", "espera", "vivir", "esperando", "veo", "vale", "saber", "pueden", "llama", "puedes", "dicen", "haciendo", "estara", "quieres", "dormir", "llegar", "une", "viendo", "tratar",
        "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "q", "z",
        "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "01", "06", "000", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "25", "29", "30", "40", "45", "50", "100"
    ];

    var _query = {
        "query": {
            "match": {
            }
        },
        "facets": {
            "blah": {
                "terms": {
                    "field": field,
                    "exclude": mode == 'terms' ? exclude_base.concat(exclude) : (exclude || []),
                    "size": "400"
                }
            }
        }
    };

    if(q && typeof q == 'string') {
        _query.query.match[field] = {
            "query": decodeURI(q),
            "operator" : "and"
        };
    } else if(q && typeof q == 'object') {
        _query.query= q.query;
    } else {
        _query.query= { "match_all": {} }
    }

    return _query;
}

function getTags(terms, cb) {
    var _terms = terms.map(function(t) {
        return t.term;
    });
    Terms.getTags(_terms, function(err, tags) {
        terms.map(function(t, i) {
            return t.tags = tags[t.term];
        });
        cb(null, terms);
    });
}

module.exports = Analysis;

function Analysis(index, type) {
    this.index = index;
    this.type = type;
}

Analysis.prototype.terms = function(q, cb) {
    search.call(this, 'terms', q, cb);
};

Analysis.prototype.shingles = function(q, cb) {
    search.call(this, 'shingles', q, cb);
};

Analysis.prototype.segmentation = function(tag, cb) {
    var _this = this;

    Terms.getTerms(tag, function(err, terms) {
        _search(terms.map(function(t) {
            if(t.split(' ').length > 1) {
                return '"'+t+'"';
            } else {
                return t;
            }
        }));
    });

    function _search(query) {
        console.log(query);
        var _shingles = query.filter(function(t) { return t.split(" ").length > 1 });
        var _terms = query.filter(function(t) { return t.split(" ").length == 1 });
        
        var q = {
            "query": {
                "bool" : {
                    "should": [
                        {
                            "terms": { 
                                "text.terms": _terms
                            }
                        },
                        {
                            "terms": { 
                                "text.shingles": _shingles
                            }
                        }
                    ]
                }
            }
        };
        console.log();
        console.log(JSON.stringify(q));console.log();
        search.call(_this, 'shingles', q, cb);
    }
};