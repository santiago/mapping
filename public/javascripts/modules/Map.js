/*
 *  @module Mapping
 *  @exports function
 *
 */
define(function() {
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
    
    return Map;
}); // define