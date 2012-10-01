var ServiceBase = require('../lib/ServiceBase');
var Store = require('../lib/Store');
var PointStore = require('./Point').store;

var MappingStore = Store('Mapping', {
    title: { type: String, index: true },
    user_id: { type: String, index: true },
    description: { type: String },
    points: { type: [PointStore] }
});

var Mapping = function() {
};

var Service = function(app) {
    this.name = 'mapping';
    this.resource = '/mappings';
    this.store = MappingStore;
    
    this.beforePost = function(req, res, next) {
        req.body.user_id = req.session.auth.userId
        next();
    };
    
    ServiceBase.call(this, app, null);

    return this;
};

module.exports = {
    store: MappingStore,
    domain: Mapping,
    service: Service
}