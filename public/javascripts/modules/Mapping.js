/*  @module Mapping
 *  @exports function
 */
define(function() {
return function(app) {
    /*  @Model Mapping
     *
     */
    var Mapping = Backbone.Model.extend({
        idAttribute: '_id',
        urlRoot: '/mappings'
    });

    /*  @Model Point
     *
     */
    var Point = Backbone.Model.extend({
        idAttribute: '_id'
    });

    /*  @Collection MappingList
     *
     */
    var MappingList = Backbone.Collection.extend({
        model: Mapping,
        url: '/mappings'
    });
    

    /*  @Collection PointList
     *
     */
    var PointList = Backbone.Collection.extend({
        model: Point
    });


    /*  @View MyMappingsView
     *
     */
    var MyMappingsView = Backbone.View.extend({
        el: $('#mis-mapas').get(),

        events: {
            "click button#addmap": "openNewMap",
            "keypress input": "captureKey",
            "click #newmap .close": "closeNewMap"
        },

        initialize: function() {
            var view = this;
            this.render();
            $(window).on('keydown', function(e) {
                if (e.keyCode == 27) {
                    view.closeNewMap();
                }
            });

            this.collection.on('sync', function(e) {
                view.render();
            });
        },

        render: function() {
            this.collection.fetch({
                data: {
                    user_id: this.user_id
                },
                success: function(coll, data) {
                    $('ul.mappings').empty();
                    data.forEach(function(item) {
                        item.id = item._id;
                        dust.render('mapping_item', item, function(err, html) {
                            $('ul.mappings').append(html);
                        });
                    });
                }
            });
        },

        openNewMap: function() {
            $('#newmap').slideDown('fast', function() {
                // $('#newmap .close').show()
            });
            $('.overlay').fadeIn('fast');
            $('#newmap input').focus();
        },

        closeNewMap: function() {
            $('#newmap').slideUp('fast', function() {
                // $('#newmap .close').hide()
            });
            $('.overlay').fadeOut('fast');
        },

        createMapping: function() {
            var title = $.trim($('#newmap input').val());
            if (!title) {
                return false
            }
            this.collection.create({
                title: title
            });
        },

        captureKey: function(e) {
            switch (e.keyCode) {
            case 13:
                this.createMapping();
                break;
            default:
                break;
            }
        },

        getMappingById: function(id) {
            var self = this;
            var mapping = this.collection.get(id) || new Mapping({ _id: id });
            mapping.fetch({
                success: function(view, data) {
                    // mapping = view;
                    success();
                }
            });

            function success() {
                app.setMappingName(mapping.get('title'));
                if(self.current_mapping && self.current_mapping.id != mapping.id) {
                    // self.current_mapping.remove(); // This should work but doesn't
                    $(self.current_mapping.el).remove();
                }
                
                self.current_mapping = new MappingView({
                    id: mapping.id,
                    model: mapping,
                    points: new PointList
                });
            }
        }
    });

    var View = new MyMappingsView({
        collection: new MappingList
    });

    /*  @View MappingView
     *
     */
    var MappingView = Backbone.View.extend({        
        initialize: function() {
            var view = this;
            
            this.render();
            this.points = this.options.points;
            this.points.url = '/mappings/'+this.id+'/points'
            
            this.points.on('sync', function(e) {
                view.closeNewPoint();
                view.refresh();
            });
        },

        events: {
            "click button#addpoint": "openNewPoint",
            "click #newpoint .close": "closeNewPoint",
            "click #newpoint #mappoint": "startPointing",
            "click #newpoint #savepoint": "savePoint"
        },
        
        render: function() {
            var view = this;
            
            var mapping = this.model.toJSON();
            dust.render('mapping', mapping, function(err, html) {
                $('.rslide-card:last').after(html);
                view.setElement($('.rslide-card.mapping').get());
                app.CardSlider.show('mapping');
            });
            
            // Clear current state
            this.$el.find('ul.points li').remove();
            Map.clearPoints();
            
            /*Map.markers.markers.forEach(function(marker) {
                console.log(marker);
                Map.markers.removeMarker(marker);
            });*/

            mapping.points.forEach(function(point) {
                view.renderPointLabel(point);
                dust.render('point_item', point, function(err, html) {
                    var $li = $('<li/>');
                    $li.html(html);
                    view.$el.find('ul.points').append($li);
                });
            });
        },
        
        renderPointLabel: function(data) {
            var point = new OpenLayers.LonLat(data.loc[1], data.loc[0]);
            point.transform(
                new OpenLayers.Projection("EPSG:4326"),
                new OpenLayers.Projection("EPSG:900913")
            );
            Map.addMarker(point);
        
            // Position label
            var popupPoint = new OpenLayers.LonLat(point.lon + 10, point.lat + 40);
            this.popup(popupPoint, data._id, data.title);
        },
        
        refresh: function() {
            var view = this;
            this.model.fetch({
                success: function() {
                    view.render();
                }
            });
        },
        
        /* Display dialog for adding a new Point
         * to this Mapping
         *
         */
        openNewPoint: function() {
            $('#newpoint').slideDown();
        },
        
        closeNewPoint: function() {
            $('#newpoint').slideUp(go.bind(this));
            $('#newpoint').find('input, textarea').val('');
            function go() {
                this.$el.find('#newpoint .info.pointing').find('.one, .two').show();
                this.$el.find('#newpoint #mappoint').show();
                this.$el.find('#newpoint .info.pointing').find('.three').hide();
                this.$el.find('#newpoint .info.pointing').hide();
                this.$el.find('#newpoint #savepoint').hide();  
            }
        },
        
        startPointing: function() {
            var view = this;
            this.$el.find('#newpoint #mappoint').fadeOut(function() {
                view.$el.find('#newpoint .info.pointing').fadeIn();
            });
            Map.startPointing();
            Map.map.events.register('click', this, this.__onClickMap);
        },
        
        stopPointing: function() {
            this.$el.find('#newpoint .info.pointing').find('.one, .two').hide();
            this.$el.find('#newpoint .info.pointing').find('.three').show();
            this.$el.find('#newpoint #savepoint').fadeIn();
            Map.map.events.unregister('click', this, this.__onClickMap);
            this._newPointMarker.events.register('click', this, this.__onClickNewPointMarker);
        },
        
        savePoint: function() {
            PointForm.setElement(this.$el.find('#newpoint'));
            var data = PointForm.getValidData();
            if(data) {
                data.mapping_id = this.id;
                this.points.create(data);
                this._newPointMarker.events.unregister('click', this, this.__onClickNewPointMarker);
                Map.map.events.unregister('click', this, this.__onClickMap);
                
                // Place definite marker
                Map.addMarker(this.__lastPoint);
                this._newPointMarker = null;
            }
        },

        popup: function(point, id, text) {
            var popup = new OpenLayers.Popup('pointlabel-'+id, // Label
                point, // Point
                new OpenLayers.Size(text.length * 8, 15), // Size
                text, // Text
                true
            );
            
            Map.map.addPopup(popup);
            
             // Style label
            var $nodeLabel = $("#pointlabel-" + id);
            $nodeLabel.addClass("pointlabel");
            $nodeLabel.css({
                border: "2px solid #666"
            });
            $nodeLabel.find('#pointlabel-' + id + '_close').remove();

            // on mouse over label
            $nodeLabel.on('mouseover', function(e) {
            $nodeLabel.addClass('hover');
            $nodeLabel.css({
                border: "2px solid blue"
                });
            });

            // on mouse out label
            $nodeLabel.on('mouseout', function(e) {
               $nodeLabel.removeClass('hover');
                $nodeLabel.css({
                    border: "2px solid #666"
                });
            });
        },

        __onClickNewPointMarker: function(e) {
            this._newPointMarker.events.unregister('click', this, this.__onClickNewPointMarker);
            Map.map.events.unregister('click', this, this.__onClickMap);
            this.startPointing();
        },
        
        __onClickMap: function(e) {
            // Get Point from Event
            var point = Map.map.getLonLatFromViewPortPx(e.xy);
            this.__lastPoint = point.clone();
            
            this._newPointMarker = Map.getMarker(point);

            point.transform(
                new OpenLayers.Projection("EPSG:900913"),
                new OpenLayers.Projection("EPSG:4326")
            );
            this.$el.find('#newpoint input[name=lat]').val(point.lat);
            this.$el.find('#newpoint input[name=lon]').val(point.lon);

            this.stopPointing();
        }
    });

    /*  @Singleton
     *  @UI Map
     *  Encapsulates all operations upon the (OpenLayers) Map itself
     */
    var Map = new(function _Map() {

        this.nodes = {};

        this.map = new OpenLayers.Map('map');
        
        var self = this;
        var map = this.map;

        var lastMouseDown = [];

        // The marker icon
        var size = new OpenLayers.Size(15, 24);
        var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
        this.markerIcon = new OpenLayers.Icon('/images/marker-3.png', size, offset);

        $("#map").on('mousedown', function(e) {
            var point = map.getLonLatFromViewPortPx({
                x: e.offsetX,
                y: e.offsetY
            });

            point.transform(
                map.getProjectionObject(), 
                new OpenLayers.Projection("EPSG:4326")
            );

            lastMouseDown = [point.lat, point.lon];
        });

        // Remove the annoying Google copyright popup
        $("#map").on('mouseup', function(e) {
            $(".olLayerGooglePoweredBy.olLayerGoogleV3").hide();
        });

        map.events.register('move', this, function(e) {
            this._moved = true;
        });

        map.__mousemove = function(e) {
            var point = map.getLonLatFromViewPortPx(e.xy);
            var marker = this.getMarker(point);
            this.markers.addMarker(marker);
        };
    
        map.events.register('click', this, function(e) {
            if (this._marking) {
                map.events.unregister('mousemove', this, map.__mousemove);
                // var newPointMarker = new OpenLayers.Marker(point, icon.clone());
                // markers.addMarker(newPointMarker);
                // this._newPointMarker = newPointMarker;
                this._marking = false;
                this._moved = false;
            }
        });

        map.addControl(new OpenLayers.Control.LayerSwitcher());

        this._marking = false;

        this.markers = new OpenLayers.Layer.Markers("Markers");
        map.addLayer(this.markers);

        var gphy = new OpenLayers.Layer.Google("Google Physical", {
            type: google.maps.MapTypeId.TERRAIN
        });

        var gmap = new OpenLayers.Layer.Google("Google Streets", // the default
        {
            numZoomLevels: 20
        });

        var ghyb = new OpenLayers.Layer.Google("Google Hybrid", {
            type: google.maps.MapTypeId.HYBRID,
            numZoomLevels: 20
        });

        var gsat = new OpenLayers.Layer.Google("Google Satellite", {
            type: google.maps.MapTypeId.SATELLITE,
            numZoomLevels: 22
        });

        var osm = new OpenLayers.Layer.OSM();

        map.addLayers([osm, gmap, gphy, ghyb, gsat]);

        // Google.v3 uses EPSG:900913 as projection, so we have to
        // transform our coordinates
        map.setCenter(new OpenLayers.LonLat(10.2, 48.9).transform(
            new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()), 5);

        map.addControl(new OpenLayers.Control.MousePosition());
    })();
    
    Map.constructor.prototype.startPointing = function() {
        this._marking = true;
        this.map.events.register('mousemove', this, this.map.__mousemove);
    };
    
    Map.constructor.prototype.stopPointing = function() {
    };
    
    Map.constructor.prototype.getMarker = function(point) {
        var marker = new OpenLayers.Marker(point, this.markerIcon);
        return marker;
    };
    
    Map.constructor.prototype.addMarker = function(point) {
        var marker = new OpenLayers.Marker(point, this.markerIcon.clone());
        this.markers.addMarker(marker);
    };
    
    Map.constructor.prototype.clearPoints = function(point) {
        this.markers.destroy();
        this.markers = new OpenLayers.Layer.Markers("Markers");
        this.map.addLayer(this.markers);
        $('.pointlabel').remove();
    };
    
    // Backbone Router for Mappings
    var MappingRouter = Backbone.Router.extend({
        routes: {
            "mapping/:id": "getMappingById",
            "mappings": "getMyMappings"
        },
        getMappingById: function(id) {
            View.getMappingById(id)
        },
        getMyMappings: function() {
            //console.log('oe');
            //View.render();
            app.CardSlider.show('mis-mapas');
        }
    });
    new MappingRouter();

    
    // Detect Geolocation
    function success(pos) {
        var position = [pos.coords.latitude, pos.coords.longitude];
        var point = new OpenLayers.LonLat(position[1], position[0]).transform(new OpenLayers.Projection("EPSG:4326"), Map.map.getProjectionObject());
        Map.map.setCenter(point, 16);
    }

    function error() {}


    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(success, error);
    } else {
        alert('Geolocation not supported');
        return;
    }
}
});