var Store = require('../lib/Store');

var PointStore = Store('Point', {
    title: { type: String, index: true },
    user_id: { type: String, index: true },
    mapping_id: { type: String, index: true },
    address: { type: String, default: '' },
    description: { type: String, index: true, default: '' },
    loc: { type: Array, index: '2d' },
    video: { type: Array },
    audio: { type: Array },
    image: { type: Array },
    created: { type: Date, default: Date.now },
    modified: { type: Date, default: Date.now }
});

var MappingStore = Store('Mapping', {
    title: { type: String, index: true },
    user_id: { type: String, index: true },
    description: { type: String },
    points: { type: [PointStore.schema] },
    created: { type: Date, default: Date.now },
    modified: { type: Date, default: Date.now }
});

var Mapping = function() {
};

Mapping.addPoint = function(mapping_id, point, callback) {
    MappingStore.findById(mapping_id, function(err, mapping) {
        mapping.points.push(point);
        mapping.save(function(err, mapping) {
            if(callback) callback(err, mapping.get('points').pop());
        });
    });
};

Mapping.removePoint = function(mapping_id, point_id, callback) {
    MappingStore.findById(mapping_id, function(err, mapping) {
        mapping.points.id(point_id).remove();
        mapping.save(callback);
    });
};

Mapping.addPhoto = function(mapping_id, point_id, name, callback) {
    MappingStore.findById(mapping_id, function(err, mapping) {
        var point = mapping.points.id(point_id);
        point.image.push(name);
        mapping.save(function(err, ok) {
            if(callback) callback(err, ok);
        });
    });
};

module.exports = {
    domain: Mapping,
    store: MappingStore
}