var _ = require('underscore');
_.str = require('underscore.string');
_.mixin(_.str.exports());

var NyN = require('../domain/NocheYNiebla');

module.exports = function NyNService(app) {
    
    function findResponsableAndTipificacion(req, res, next) {
        NyN.findResponsableAndTipificacion(req.query.responsables, req.query.tipificaciones, function(err, reportes) {
            req.tipificacion_facet = reportes.facets.tipificaciones.terms;
            req.responsable_facet = reportes.facets.responsables.terms;
            delete reportes.facets;
            req.reportes = reportes;
            next();
        });
    }
    
    function getUbicaciones(req, res, next) {
        NyN.getUbicaciones(function(err, data) {
            req.ubicaciones = data;
            next();
        });
    }
    
    function getUbicacionesOk(req, res, next) {
        NyN.getUbicacionesOk(function(err, data) {
            req.ubicaciones = data;
            next();
        });
    }
    
    function findUbicacion(req, res, next) {
        NyN.findUbicacion(req.body.ubicacion, function(err, data) {
            req.ubicacion = data;
            next();
        });
    }
    
    function updateUbicacion(req, res, next) {
        NyN.updateUbicacion(req.body.orig, req.body.update, function() {
            next();
        });
    }
    
    function getUbicacionesGeo(req, res, next) {
        NyN.getUbicacionesGeo(req.params.depto, function(err, data) {
            req.ubicaciones = data;
            next();
        });
    }
    
    // NocheYNiebla home
    // @uri /nocheyniebla
    app.get('/nocheyniebla', findResponsableAndTipificacion, getUbicaciones, function(req, res) {
        res.render('noche-y-niebla/index', {
            responsables: NyN.params.responsables,
            tipificaciones: NyN.params.tipificaciones,
            tipificacion_facet: req.tipificacion_facet,
            responsable_facet: req.responsable_facet,
            ubicaciones: req.ubicaciones
        });
    });
    
    app.get('/nocheyniebla/ubicaciones', getUbicacionesOk, function(req, res) {
        var byDepto = {};
        req.ubicaciones.forEach(function(u) {
            var depto = null;
            try {
              depto = u.match(new RegExp(".+,(.+)$"))[1];
            } catch(e) { return; }
            try {
              byDepto[depto].push(u);
            } catch(e) { byDepto[depto] = [u] }
        });

        res.render('noche-y-niebla/ubicaciones-home', {
            byDepto: byDepto['antioquia'],
            deptos: Object.keys(byDepto).map(function(d) { return _(d).capitalize() }).sort()
        });
    });

    app.get('/nocheyniebla/ubicaciones/:depto.html', getUbicacionesOk, function(req, res) {
        res.render('noche-y-niebla/ubicaciones', {
            byDepto: req.ubicaciones.filter(function(u) {
                return u.match(new RegExp(req.params.depto+"$"));
            })
        });
    });

    // GeoJSON features for mapping circles on locations
    app.get('/nocheyniebla/ubicaciones/:depto.geojson', getUbicacionesGeo, function(req, res) {
        res.send(req.ubicaciones);
    });

    // Update the label of 'ubicaciones'
    // @param orig    old label
    // @param update  new label
    // @uri /nocheyniebla/ubicaciones
    app.post('/nocheyniebla/ubicaciones', updateUbicacion, function(req, res) {
        res.send({ ok: true });
    });
    
};