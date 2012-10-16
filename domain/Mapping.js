var formidable = require('formidable');
var ServiceBase = require('../lib/ServiceBase');
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

var Service = function(app) {
    this.name = 'mapping';
    this.resource = '/mappings';
    this.store = MappingStore;
    
    this.beforePost = function(req, res, next) {
        req.body.user_id = req.session.auth.userId
        next();
    };
    
    ServiceBase.call(this, app, null);
    
    app.post('/mappings/:mapping_id/points/:point_id/image', this.beforePost, function(req, res) {
        var form = new formidable.IncomingForm;

        form.onPart = function (part) {
            console.log('part');
            console.log(part);
            if (!part.filename) return this.handlePart(part);
            
            console.log(part);
            
            part.on('data', function(buffer) {
                console.log(buffer)
            });
            
            part.on('end', function() {
                console.log('wuu!!')
                res.send('ok')
            });
            
            // gm(part).resize(200, 200).stream(function (err, stdout, stderr) {
            //    stdout.pipe(fs.createWriteStream('my/new/path/to/img.png'));
            //});
        };
    });
    
    app.post('/mappings/:mapping_id/points', this.beforePost, function(req, res) {
        MappingStore.findById(req.params.mapping_id, function(err, mapping) {
            req.body.loc = [parseFloat(req.body.lat), parseFloat(req.body.lon)];
            delete req.body['lat'];
            delete req.body['lon'];
            mapping.points.push(req.body);
            mapping.save(function(err, ok) {
                res.send({ ok: true });
            });
        });
    });

    return this;
};

module.exports = {
    store: MappingStore,
    domain: Mapping,
    service: Service
}