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
                      'marker-color': '#ff0000',
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
    }
    
    /*  @Singleton
     *  @UI MapBox Implemantion of Map interface
     */
    var Map = function _Map() {
        this.nodes = {};
        mapbox.auto('map', 'examples.map-vyofok3q', render.bind(this));
    }
    
    Map.prototype.startPointing = function(callback) {
        var self = this;
        this._marking = true;
        
        if(!this.pointingLayer) {
            this.pointingLayer = mapbox.markers.layer();
            this.pointingLayer.features([{
                "geometry": { "type": "Point", "coordinates": [0, 0]},
                "properties": { "id": 1 }
            }]);
            this.map.addLayer(this.pointingLayer);
        }
        
        this.pointingLayer.enable();
        var marker = this.pointingLayer.markers()[0].data;
        console.log('aja');
        console.log(marker);
        $('#map').on('mousemove', function(e) {
            var location = self.map.pointLocation({ x: e.pageX, y: e.pageY-32});
            marker.geometry.coordinates[0] = location.lon;
            marker.geometry.coordinates[1] = location.lat;
            self.pointingLayer.features([marker]);
        });
        
        $('#map').one('click', this.stopPointing.bind(this));
    };
    
    Map.prototype.stopPointing = function(e) {
        var self = this;
        $('#map').unbind('mousemove');
        var markers = this.pointingLayer.markers();
        $(markers[0].element).one('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            self.startPointing();
        });

        $('#map').trigger('stopPointing', this.map.pointLocation({ x: e.pageX, y: e.pageY-32 }));
    };
    
    Map.prototype.disablePointing = function() {
        this.pointingLayer.disable();
    },
    
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
        this.markers.destroy();
        this.markers = mapbox.markers.layer();
        this.map.addLayer(this.markers);

        $('.pointlabel').remove();
    };    
    
    return Map;
}); // define