$(function() {
    
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
        
        function getDepto(depto) {
            ubicacionesMapView.showOnly(depto);
        }
        
        function onClickMapOn(e) {
            e.preventDefault();
            var depto = $(this).closest('li').find('.panel-title a').attr('href').replace('#', '');
            $(this).addClass('btn-success'); $(this).removeClass('btn-default');
            $(this).unbind('click'); $(this).click(onClickMapOff);
            
            ubicacionesMapView.show(depto);
        }
        
        function onClickMapOff(e) {
            e.preventDefault();
            var depto = $(this).closest('li').find('.panel-title a').attr('href').replace('#', '');
            $(this).removeClass('btn-success');
            $(this).addClass('btn-default');
            $(this).unbind('click');
            $(this).click(onClickMapOn);
            
            ubicacionesMapView.hide(depto);
        }
        
        // Bind all 'Map' buttons to click
        $('button.btn-default.map').click(onClickMapOn);
        $('button.btn-success.map').click(onClickMapOff);

        // Backbone Router for this component
        var Router = new (Backbone.Router.extend({
            routes: {
                ":depto": function(depto) {
                    getDepto(depto);
                }
            }
        }))();

        Backbone.history.start();
        
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
            this.model = new CircleMapper({ url: o.url });
            this.map = map;
            this.circles = {};
        }
        
        CircleMapperView.prototype.showOnly = function(label) {
            this.hideAll();
            this.setActive(label);
        };
        
        CircleMapperView.prototype.hideAll = function() {
            var _this = this;
            this.model.getAll(function(err, data) {
                for(var label in data) {
                    _this.circles[label].forEach(function(circle) {
                        _this.map.remove(circle);
                    });
                }
            });
        };
        
        CircleMapperView.prototype.add = function(label, cb) {
            var _this = this;
            this.model.get(label, function(err, data) {
                _this.circles[label] = data.map(function(c) {
                    L.circle(c.location, c.casos*250, { weight: 2 });
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
        
        CircleMapperView.prototype.render = function(labels) {
            if(!labels) { throw('Must specify what layer to render') }
            labels = typeof labels === 'string' ? [labels] : labels||[];
            var _this = this;

            // These are the new layers that need to be rendered
            var setActive = _.difference(labels, this.active);
            console.log(labels);
            console.log(setActive);
            this.active = labels;

            // Hide inactive. Remove layers that won't go for this render
            Object.keys(_this.circles).filter(function(label) {
                return labels.indexOf(label) == -1;
            })
            .forEach(function(label) {
                _this.circles[label].forEach(function(circle) {
                    _this.map.removeLayer(circle);
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
                    circle.addTo(_this.map);
                });
            }
        };
    }

});