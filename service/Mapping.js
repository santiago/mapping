var upload = require('../lib/Upload')();
var ServiceBase = require('../lib/ServiceBase');

var Mapping = require('../domain/Mapping').domain;
var MappingStore = require('../domain/Mapping').store;

module.exports = function(app) {
    this.name = 'mapping';
    this.resource = '/mappings';
    this.store = MappingStore;
    
    this.beforePost = function(req, res, next) {
        req.body.user_id = req.session.auth.userId
        next();
    };
    
    ServiceBase.call(this, app, null);
    
    app.post('/mappings/:mapping_id/points/:point_id/image', upload, function(req, res) {
        res.send('ok')
    });
    
    app.del('/mappings/:mapping_id/points/:point_id', function(req, res) {
        Mapping.removePoint(req.params.mapping_id, req.params.point_id, function() {
            res.send({ ok: true });
        });
    });

    app.post('/mappings/:mapping_id/points', this.beforePost, function(req, res) {
        req.body.loc = [parseFloat(req.body.lat), parseFloat(req.body.lon)];
        delete req.body['lat'];
        delete req.body['lon'];

        Mapping.addPoint(req.params.mapping_id, req.body, function(err, point) {
            res.send(point);
        });
    });

    return this;
};