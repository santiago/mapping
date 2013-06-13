var redis = require('redis').createClient();

var ServiceBase = require('../lib/ServiceBase');

var Mapping = require('../domain/Mapping').domain;
var MappingStore = require('../domain/Mapping').store;

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

    return this;
};