var esclient = (function() {
    var fork = true;
    if(fork) {
        return require('/Projects/node-elasticsearch-client');
    }
    return require('elasticsearchclient');
})();

// Initialize ES
module.exports = (function() {
    var opts = {
        host: 'localhost',
        port: 9200
    };

    return new (esclient)(opts);
})();

function Search() {
}


var query = {
    "query": {
        "match": {
            "text.terms": {
                "query": "alfredomolanob dialogoeslaruta paicma redprodepaz verdadabierta",
                "size": 200
            }
        }
    },
    "facets": {
        "blah": {
            "terms": {
                "field": "text.shingles",
                "size": "1000"
            }
        }
    }
};

var query2= {
    "query": {
            "terms" : {
                "text.terms" : [ "alfredomolanob", "dialogoeslaruta", "paicma", "redprodepaz", "verdadabierta" ],
                "minimum_should_match" : 1
            }
    },
    "facets": {
        "blah": {
            "terms": {
                "field": "text.shingles",
                "size": "1000"
            }
        }
    }
}

// This is wrong
var query3 = {
    "query": {
        "span_or" : {
            "clauses" : [
                { "span_term" : { "text.shingles" : "*alfredomolanob*" } },
                { "span_term" : { "text.shingles" : "*dialogoeslaruta*" } },
                { "span_term" : { "text.shingles" : "*paicma*" } },
                { "span_term" : { "text.shingles" : "*verdadabierta*" } },
                { "span_term" : { "text.shingles" : "paro minero" } }
            ]
        }
    },
    "facets": {
        "blah": {
            "terms": {
                "field": "text.shingles",
                "size": "1000"
            }
        }
    }
};

var query4 = {
    "query": {
        "multi_match" : {
            "query" : "alfredomolanob dialogoeslaruta paicma verdadabierta paro minero",
            "fields" : [ "text.terms", "text.shingles" ]
        }
    },
    "facets": {
        "blah": {
            "terms": {
                "field": "text.shingles",
                "size": "1000"
            }
        }
    }
}

var query5 = {
    "query": {
        "query_string" : {
            "fields" : ["text.*"],
            "query" : "alfredomolanob dialogoeslaruta paicma verdadabierta paro minero",
            "use_dis_max" : true
        }
    },
    "facets": {
        "blah": {
            "terms": {
                "field": "text.shingles",
                "size": "1000"
            }
        }
    }
};