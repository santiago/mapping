var ServiceBase = require('../lib/ServiceBase');
var Store = require('../lib/Store');
var PointStore = require('./Point').store;

var MappingStore = Store('Mapping', {
    title: { type: String },
    user_id: { type: String },
    description: { type: String },
    points: { type: [PointStore] }
});

var Mapping = function() {
};

var Service = function(app) {
    this.name = 'mapping';
    this.resource = '/mappings';
    this.store = MappingStore;
    
    ServiceBase.call(this, app, null);

    return this;
};

module.exports = {
    store: MappingStore,
    domain: Mapping,
    service: Service
}