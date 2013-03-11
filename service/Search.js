var Mapping = require('../domain/Mapping').domain;
var MappingStore = require('../domain/Mapping').store;

var search = function(req, res, next){
    // HAGO LA BUSQUEDA
    var result = {};
    res.send(result);
}

module.exports = function(app){
    app.get('/search', search, function(req, res){
	// Que hago
    }

};

