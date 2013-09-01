$(function() {
    
    // @Model CircleMapper
    function CircleMapper(o) {
        this.url = o.url;
        this.layers = [];
    }
    
    CircleMapper.prototype.get = function(label, cb) {
        if(this.layers[label]) {
           return cb(null, this.layers[label]);
        }
        $.getJSON(this.url(label), function(data) {
            this.layers[label] = data;
            cb(null, data);
        }.bind(this));
    };
    
    CircleMapper.prototype.getAll = function(cb) {
        cb(this.layers);
    };
    
    // @UI CircleMapperView
    function CircleMapperView(map, o) {
        this.active = [];
        this.model = o.model || new CircleMapper({ url: o.url });
        this.map = map;
        this.circles = {};
    }
    
    CircleMapperView.prototype.showOnly = function(label) {
        var _this = this;
        this.model.get(label, function(err, data) {
            _this.circles[label]
        });
        this.render(label);
    };
    
    CircleMapperView.prototype.add = function(label, cb) {
        var _this = this;
        this.model.get(label, function(err, data) {
            _this.circles[label] = data.map(function(c) {
                if(!c.location) { return null; }
                return L.circle(c.location, c.casos*250, { weight: 2 }); // In meters
                // return L.circleMarker(c.location, { radius: c.casos/10 }).addTo(map); // In pixels
            });
            cb();
            // L.layerGroup(circles).addTo(map);
        });            
    };
    
    CircleMapperView.prototype.addActive = function(labels) {
        labels = typeof labels === 'string' ? [labels] : labels||[];
        this.render(_.uniq(labels.concat(this.active)));
    };
    
    CircleMapperView.prototype.show = CircleMapperView.prototype.addActive;
    
    CircleMapperView.prototype.hide = function(labels) {
        labels = typeof labels === 'string' ? [labels] : labels||[];
        this.render(_.without.apply(null, [this.active].concat(labels)));
    };
    
    CircleMapperView.prototype.showCircle = function(layerLabel, circleLabel) {
        var _this = this;
        this.model.get(layerLabel, function(err, data) {
            var index = function(u) {
                for(var i in data) {
                    if(data[i].title == circleLabel) return i;
                }
            }();
        
            _this.circles[layerLabel][index].addTo(_this.map);
        });
    };
    
    CircleMapperView.prototype.hideCircle = function(layerLabel, circleLabel) {
        var _this = this;
        this.model.get(layerLabel, function(err, data) {
            var index = function(u) {
                for(var i in data) {
                    if(data[i].title == circleLabel) return i;
                }
            }();
        
            _this.map.removeLayer(_this.circles[layerLabel][index]);
        });
    };
    
    CircleMapperView.prototype.render = function(labels) {
        if(!labels) { throw('Must specify what layer to render') }
        labels = typeof labels === 'string' ? [labels] : labels||[];
        var _this = this;

        // These are the new layers that need to be rendered
        var setActive = _.difference(labels, this.active);
        this.active = labels;

        // Hide inactive. Remove layers that won't go for this render
        Object.keys(_this.circles).filter(function(label) {
            return labels.indexOf(label) == -1;
        })
        .forEach(function(label) {
            _this.circles[label].forEach(function(circle) {
                if(circle) _this.map.removeLayer(circle);
            });
        });

        // Make sure all circles needed are already loaded
        loadCircles();
        function loadCircles() {
            var label = setActive.shift();
            if(!label) { return; }
            // Render when it's done loading
            _this.add(label, function() {
                loadCircles();
                _render(label);
            });
        }

        function _render(label) {            
            _this.circles[label].forEach(function(circle) {
                if(circle) circle.addTo(_this.map);
            });
        }
    };
    
    // Init according content
    $("#map").length > 0 ? Ubicaciones() : Casos();
  
    // Casos
    function Casos() {
        $('.update-ubicacion').click(function(e) {
            var self = this;
            e.preventDefault();
            var orig = $(this).closest('li').find('input[type=hidden]').val();
            var ok = $(this).closest('li').find('input[type=text]').val();
            $.post('/nocheyniebla/ubicaciones', { orig: orig, update: ok }, function(data) {
                $(self).closest('li').fadeOut().remove();
            });
        });
    }
    
    // Ubicaciones
    function Ubicaciones() {
        var map = L.mapbox.map('map', 'examples.map-20v6611k');
        map.dragging.enable();
        map.setView([4.5980478, - 74.0760867], 6);
        
        var ubicacionesMapView = new CircleMapperView(map, {
            url: function(label) {
                return '/nocheyniebla/ubicaciones/'+label+'.geojson'
            }
        });
        
        function getDepto(depto, cb) {
            ubicacionesMapView.showOnly(depto);
            
            function _onClickMapOn() {
                $(this).addClass('btn-success');
                $(this).removeClass('btn-default');
                $(this).unbind('click');
                $(this).click(_onClickMapOff);
                
                var ubicacion = $(this).closest('li').find('[type=hidden]').val();
                ubicacionesMapView.showCircle(depto, ubicacion);
            }
            
            function _onClickMapOff(e) {
                $(this).removeClass('btn-success');
                $(this).addClass('btn-default');
                $(this).unbind('click');
                $(this).click(_onClickMapOn);
                
                var ubicacion = $(this).closest('li').find('[type=hidden]').val();
                ubicacionesMapView.hideCircle(depto, ubicacion);
            }

            $('.panel-depto').load('/nocheyniebla/ubicaciones/'+depto+'.html', function() {
                ubicacionesMapView.model.get(depto, function(err, data) {
                    data.forEach(function(u) {
                        if(!u.location) {
                            $('.panel-depto li input[value="'+u.title+'"]')
                                .closest('li')
                                    .addClass('danger')
                                    .find('button.map').hide();
                        }
                    });
                    if(cb) cb();
                });
                
                // Bind all 'Map' buttons to click
                $('button.btn-default.map').click(_onClickMapOn);
                $('button.btn-success.map').click(_onClickMapOff);
            });

        }
        
        function getDeptoList() {
            $('.panel-depto').parent().load('/nocheyniebla/ubicaciones .panel-depto', function() {
                // Bind all 'Map' buttons to click
                $('button.btn-default.map').click(_onClickMapOn);
                $('button.btn-success.map').click(_onClickMapOff);
            });
            
            function _onClickMapOn(e) {
                e.preventDefault();
                var depto = $(this).closest('li').find('.panel-title a').attr('href').replace('#', '');
                $(this).addClass('btn-success'); $(this).removeClass('btn-default');
                $(this).unbind('click'); $(this).click(_onClickMapOff);
                
                ubicacionesMapView.show(depto);
            }
            
            function _onClickMapOff(e) {
                e.preventDefault();
                var depto = $(this).closest('li').find('.panel-title a').attr('href').replace('#', '');
                $(this).removeClass('btn-success');
                $(this).addClass('btn-default');
                $(this).unbind('click');
                $(this).click(_onClickMapOn);
                
                ubicacionesMapView.hide(depto);
            }
        }
        
        function getTipificaciones(depto) {
            getDepto(depto, function() {
                var $tpl = $('#tipificaciones-tpl ul.list-group').clone();
                $tpl.removeAttr('id');
                $('#ubicaciones-tpl').append($('.panel-depto.in ul.list-group'));
                $('.panel-depto.in').append($tpl);
            });
        }

        function getResponsables(depto) {
            getDepto(depto, function() {
                var $tpl = $('#responsables-tpl ul.list-group').clone();
                $tpl.removeAttr('id');
                $('#ubicaciones-tpl').append($('.panel-depto.in ul.list-group'));
                $('.panel-depto.in').append($tpl);
            });
            
        }

        // Backbone Router for this component
        var Router = new (Backbone.Router.extend({
            routes: {
                "": getDeptoList,
                ":depto": getDepto,
                ":depto/tipificaciones": getTipificaciones,
                ":depto/responsables": getResponsables
            }
        }))();

        Backbone.history.start();
        
    }
});