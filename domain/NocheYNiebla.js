var es = require('./Search');
var params = require('./noche-y-niebla');
var redis = require('redis').createClient();
var _ = require('underscore');

module.exports = {
    'findResponsableAndTipificacion': findResponsableAndTipificacion,
    'getUbicaciones': getUbicaciones,
    'getUbicacionesOk': getUbicacionesOk,
    'getUbicacionesGeo': getUbicacionesGeo,
    'getUbicacionesCasos': getUbicacionesCasos,
    'findUbicacion': findUbicacion,
    'updateUbicacion': updateUbicacion,
    'params': params
};

// Add 'update' to :casos:ok table and remove 'orig'
// from :casos table
function updateUbicacion(orig, update, cb) {
    findUbicacion(orig, function(err, data) {
        if(err || !data || !data.length) {
            console.log('ehhhhh');
            cb();
            return;
        }
        
        redis.hget('nocheyniebla:ubicacion:casos:ok', update, function(err, current) {
            if(current) { 
                current = current.split(',');
            } else {
                current = [];
            }
            
            doUpdate(current.concat(data).join(','));
        });
        
        function doUpdate(casos) {
            redis.hset('nocheyniebla:ubicacion:casos:ok', update, casos, function(err, data) {
                if(!err) {
                    redis.hdel('nocheyniebla:ubicacion:casos', orig);
                }
                cb(err);
            });
        }
    });
}

function findUbicacion(ubicacion, cb) {
    redis.hget('nocheyniebla:ubicacion:casos', ubicacion, function(err, data) {
        cb(err, data && data.split(','));
    });
}

// Finds corrected ubicaciones
function findUbicacion(ubicacion, cb) {
    redis.hget('nocheyniebla:ubicacion:casos', ubicacion, function(err, data) {
        cb(err, data && data.split(','));
    });
}

// Gets ubicaciones with charset problems
function getUbicaciones(cb) {
    redis.hkeys('nocheyniebla:ubicacion:casos', cb);
}

// Gets ubicaciones with charset problems
function getUbicacionesOk(cb) {
    redis.hkeys('nocheyniebla:ubicacion:casos:ok', cb);
}

function getUbicacionesCasos(cb) {
    redis.hgetall('nocheyniebla:ubicacion:casos:ok', cb);
}

function getUbicacionesGeo(depto, cb) {
    getUbicacionesCasos(_getUbicacionesGeo);
    
    function _getUbicacionesGeo(err, casos) {
        redis.hgetall('nocheyniebla:ubicaciones:geo', function(err, data) {
            var locations = Object.keys(data).filter(function(k) {
                return k.match(new RegExp(","+depto+",colombia$")); // && data[k];
            });

            cb( null,
                locations.map(function(u) {
                    var location = data[u].split(',').map(function(l) { return (parseFloat(l||0))||null; });
                    location = (_.compact(location).length||null) && location;
                    var title = u.replace(/,colombia$/, '');
                    return {
                        "title": title,
                        "location": location,
                        "casos": casos[title].split(',').length
                    }
                })
            )
        });
    }
}

function getUbicacionesGeoJSON(depto, cb) {
    redis.hgetall('nocheyniebla:ubicaciones:geo', function(err, data) {
        var locations = Object.keys(data).filter(function(k) {
            return k.match(new RegExp(depto+",colombia$"));
        })
        .map(function(k) {
            return data[k].split(',').map(function(n) { return parseFloat(n) }).reverse();
        })
        .filter(function(i) {
            return !!i[0];
        });
        
        var features =  Object.keys(data).map(function(u) {
            var feature =  {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": data[u]
                },
                "properties": {
                    "title": u
                }   
            }
            return feature;
        });
        
        cb(null, {
            "type": "FeatureCollection",
            "features": features
        });
    });
}

function getAllFacets(callback) {
    var query = {
        "query": {
            "match_all": {}
        },
        "facets": {
            "responsables": {
                "terms": {
                    "field": "_responsable",
                    "size": "7000"
                }
            },               
            "tipificaciones": {
                "terms": {
                    "field": "_tipificacion",
                    "size": "7000"
                }
            },
            "ubicaciones": {
                "terms": {
                    "field": "_ubicacion",
                    "size": "7000"
                }
            }
        }
    }
}

// @api public
function findResponsableAndTipificacion(ubicaciones, responsables, tipificaciones, callback) {
    var q = {
        "query": {
            "bool" : {
                "should": [
                    {
                        "terms": { 
                            "_responsable": responsables||[]
                        }
                    },
                    {
                        "terms": { 
                            "_tipificacion": tipificaciones||[]
                        }
                    },
                    {
                        "terms": { 
                            "_ubicacion": ubicaciones||[]
                        }
                    }
                ]
            }
        },
        "facets": {
            "responsables": {
                "terms": {
                    "field": "_responsable",
                    "size": "100"
                },
            },               
            "tipificaciones": {
                "terms": {
                    "field": "_tipificacion",
                    "size": "1000"
                }
            }
        }
    };
    
    if(!responsables && !tipificaciones) {
        q.query = {
            "match_all": {}
        };
    }

    es.search('nocheyniebla', 'reporte', q, function(err, data) {
        if(err) {
            callback(err);
            return;
        }
        callback(null, JSON.parse(data));
    });
}