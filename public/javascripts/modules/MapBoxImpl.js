/*
 *  @module Mapping
 *  @exports function
 *
 */
define(function() {
    function render(map) {
        console.log(this)
        
        this.map = map;
        /*l = d3layer().data(new_jersey);
        map.addLayer(l);
        map.extent(l.extent());*/
            
        $('#map').trigger('mapready');
        
        function error() {}
            
        function success(position) {
            map.zoom(17).center({
                lat: position.coords.latitude,
                lon: position.coords.longitude
            });
            this.markers.add_feature({
                  geometry: {
                      coordinates: [
                          position.coords.longitude,
                          position.coords.latitude]
                  },
                  properties: {
                      'marker-color': '#000',
                      'marker-symbol': 'star-stroked',
                  }
             });
        }
            
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(success.bind(this), error);
        } else {
            alert('Geolocation not supported');
            return;
        }
        
        // Create an empty markers layer
        this.markers = mapbox.markers.layer();
        this.map.addLayer(this.markers);
        
        this.map.__mousemove = function(e) {
            // var point = map.getLonLatFromViewPortPx(e.xy);
            console.log(e.xy)
        };
    }
    
    /*  @Singleton
     *  @UI MapBox Implemantion of Map interface
     */
    var Map = function _Map() {

        this.nodes = {};

        mapbox.auto('map', 'examples.map-vyofok3q', render.bind(this));

        var lastMouseDown = [];

        $("#map").on('mousedown', function(e) {
            /*var point = map.getLonLatFromViewPortPx({
                x: e.offsetX,
                y: e.offsetY
            });

            point.transform(
                map.getProjectionObject(), 
                new OpenLayers.Projection("EPSG:4326")
            );*/

        });

        // Remove the annoying Google copyright popup
        $("#map").on('mouseup', function(e) {
            $(".olLayerGooglePoweredBy.olLayerGoogleV3").hide();
        });

        /*map.events.register('move', this, function(e) {
            this._moved = true;
        });*/

        /*this.map.__mousemove = function(e) {
            //var point = map.getLonLatFromViewPortPx(e.xy);
            //var marker = this.getMarker(point);
            //this.markers.addMarker(marker);
            //this.markers.addMarker();
        };*/
    
        /*map.events.register('click', this, function(e) {
            if (this._marking) {
                map.events.unregister('mousemove', this, map.__mousemove);
                this._marking = false;
                this._moved = false;
            }
        });

        map.addControl(new OpenLayers.Control.LayerSwitcher());*/

        this._marking = false;

        /*this.markers = new OpenLayers.Layer.Markers("Markers");*/
        /*this.markers = mapbox.markers.layer();
        map.addLayer(this.markers);*/
        
        /*var gphy = new OpenLayers.Layer.Google("Google Physical", {
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

        map.addControl(new OpenLayers.Control.MousePosition());*/
    }
    
    Map.prototype.startPointing = function() {
        var self = this;
        this._marking = true;
        $('#map').on('mousemove', function(e) {
            var location = self.map.pointLocation({ x: e.pageX, y: e.pageY});
            // var marker = self.addMarker([location.lat, location.lon]);
            $("img.drag-marker").show();
            $("img.drag-marker").css({ left: e.pageX-10, top: e.pageY-20});
        });
    };
    
    Map.prototype.stopPointing = function() {
    };
    
    Map.prototype.getMarker = function(point) {
        var marker = new OpenLayers.Marker(point, this.markerIcon);
        return marker;
    };
    
    Map.prototype.addMarker = function(point) {
        return this.markers.add_feature({
            geometry: {
                coordinates: point.reverse()
            },
            properties: {
              'marker-color': '#000',
              'marker-symbol': 'star-stroked',
            }
        });
    };
    
    Map.prototype.clearPoints = function(point) {
        console.log(this.markers)
        this.markers.destroy();
        this.markers = mapbox.markers.layer();
        this.map.addLayer(this.markers);

        $('.pointlabel').remove();
    };    
    
    return Map;
}); // define