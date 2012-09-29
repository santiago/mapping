var ServiceBase = require('../lib/ServiceBase');
var Store = require('../lib/Store');

var PointStore = Store('Point', {
    title: { type: String },
    user_id: { type: String },
    mapping_id: { type: String },
    description: { type: String },
    lat: { type: Number },
    lon: { type: Number },
    video: { type: Array },
    audio: { type: Array },
    image: { type: Array }
});

var Point = function() {
};

var Service = function(app) {
    this.name = 'point';
    this.resource = '/points';
    this.store = PointStore;
    
    ServiceBase.call(this, app, null);

    return this;
};

module.exports = {
    store: PointStore,
    domain: Point,
    service: Service
}