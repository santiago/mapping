var ServiceBase = require('../lib/ServiceBase');
var Store = require('../lib/Store');

var PointStore = Store('Point', {
    title: { type: String },
    user_id: { type: String },
    mapping_id: { type: String },
    address: { type: String },
    description: { type: String },
    loc: { type: Array, index: '2d' },
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
    
    this.beforePost = function(req, res, next) {
        req.body.user_id = req.session.auth.userId
        req.body.loc = [parseFloat(req.body.lat), parseFloat(req.body.lon)];
        delete req.body['lat'];
        delete req.body['lon'];
        next();
    };

    ServiceBase.call(this, app, null);

    return this;
};

module.exports = {
    store: PointStore,
    domain: Point,
    service: Service
}