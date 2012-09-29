var ServiceBase = require('../lib/ServiceBase');
var Store = require('../lib/Store');

var CommentStore = Store('Comment', {
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

var MappingService = function(app) {
    this.name = 'comment';
    this.resource = '/mappings/:mapping_id/comments';
    this.store = CommentStore;
    
    ServiceBase.call(this, app, null);

    return this;
};

var PointService = function(app) {
    this.name = 'comment';
    this.resource = '/points/:point_id/comments';
    this.store = CommentStore;
    
    ServiceBase.call(this, app, null);

    return this;
};

module.exports = {
    store: CommentStore,
    domain: Point,
    service: [MappingService, PointService]
}