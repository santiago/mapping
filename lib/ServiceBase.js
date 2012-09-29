module.exports = function(app, options) {

    options = options || {};

    var resource = this.resource;
    var name = this.name;
    var plural = name + 's';
    var store = this.store;
    var name_id = name + '_id';

    function get(req, res, next) {
        var query = (function() {
            if (req.params[name_id]) {
                return {
                    _id: req.params[name_id]
                }
            }
            if (req.query) {
                return req.query;
            }
            return null;
        })();

        // Find by Id
        if (query) {
            if (query._id) {
                store.findOne(query, function(err, r) {
                    req[name] = r;
                    next();
                });
            }
            else {
                store.find(query, function(err, records) {
                    req[plural] = records;
                    next();
                });
            }
        }
    }

    function post(req, res, next) {
        var data = req.body;
    	var model = new store(data);
		model.save(function(err, r) {
			if (err) {
				res.send(500);
			}
			req[name] = r;
			next();
		});
    }

    function put(req, res, next) {
        var data = req.body;
    	var id = req.params[name_id];

		store.findById(id, function(err, r) {
			for(f in data) {
				r.set(f, data[f]);
			}
			r.save(next);
		});
    }

    function del(req, res, next) {
        var id = req.params[name_id];
        Equipamiento.findByIdAndRemove(id, function(err, r) {
            next();
        });
    }

    app.get(resource, get, function(req, res) {
        res.send(req[plural]); 
    });

    app.get(resource + '/:mapping_id', get, function(req, res) {
        res.send(req[name]);
    });

    app.post(resource, post, function(req, res) {
        res.send(req[name]);
    });

    app.post(resource + '/:mapping_id', put, function(req, res) {
        res.send({ok: 1});
    });

    app.put(resource + '/:mapping_id', put, function(req, res) {
        res.send({ok: 1});
    });

    app.del(resource + '/:mapping_id', del, function(req, res) {
        res.send({ok: 1});
    });
}