$(function() {

    var map = L.mapbox.map('map', 'examples.map-20v6611k');

    var geoJson = [{
        type: 'Feature',
        "geometry": { "type": "Point", "coordinates": [-77.03, 38.90]},
        "properties": {
            "image": "http://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Cherry_Blossoms_and_Washington_Monument.jpg/320px-Cherry_Blossoms_and_Washington_Monument.jpg",
            "url": "http://en.wikipedia.org/wiki/Washington,_D.C.",
            "marker-symbol": "star",
            "city": "Washington, D.C."
        }
    }, {
        type: 'Feature',
        "geometry": { "type": "Point", "coordinates": [-87.63, 41.88]},
        "properties": {
            "image": "http://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Chicago_sunrise_1.jpg/640px-Chicago_sunrise_1.jpg",
            "url": "http://en.wikipedia.org/wiki/Chicago",
            "city": "Chicago"
        }
    }, {
        type: 'Feature',
        "geometry": { "type": "Point", "coordinates": [-74.00, 40.71]},
        "properties": {
            "image": "http://upload.wikimedia.org/wikipedia/commons/thumb/3/39/NYC_Top_of_the_Rock_Pano.jpg/640px-NYC_Top_of_the_Rock_Pano.jpg",
            "url": "http://en.wikipedia.org/wiki/New_York_City",
            "city": "New York City"
        }
    }];

    // Add features to the map
    // map.markerLayer.setGeoJSON(geoJson);
    // map.markerLayer.loadURL('/twitter/municipios');

    // Cycle through markers once geoJson is ready.
    // Add custom popups to each using our custom feature properties
    map.markerLayer.on('ready', function(e) {
        this.eachLayer(function(marker) {

            var feature = marker.feature;

            // Create custom popup content
            var popupContent =  '<h2>' + feature.properties.city + '</h2>';

            // http://leafletjs.com/reference.html#popup
            marker.bindPopup(popupContent,{
                closeButton: false,
                minWidth: 320
            });

        });
    });

    map.setView([4.5980478, -74.0760867], 6);

    setTimeout(getData, 2000);

    function getData() {
        $.getJSON('/twitter/municipios', function(data) {
            var circles = data.geometry.coordinates
                .map(function(c) {
                    return L.circle(c.reverse(), 200).addTo(map)
                });

            // L.layerGroup(circles).addTo(map);
        });        
    }









    //     map.zoom(6).center({
    //         lat: 4.5980478,
    //         lon: -74.0760867
    //     });

    
    // /*  @Singleton
    //  *  @UI MapBox Implemantion of Map interface
    //  */
    // var Map = function _Map() {
    //     mapbox.auto('map', 'examples.map-20v6611k', render.bind(this));
    // };

    // new Map();

});