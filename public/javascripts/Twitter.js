$(function() {

    var map = L.mapbox.map('map', 'examples.map-20v6611k');

    var geoJson = [{
        type: 'Feature',
        "geometry": {
            "type": "Point",
            "coordinates": [-77.03, 38.90]
        },
        "properties": {
            "image": "http://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Cherry_Blossoms_and_Washington_Monument.jpg/320px-Cherry_Blossoms_and_Washington_Monument.jpg",
            "url": "http://en.wikipedia.org/wiki/Washington,_D.C.",
            "marker-symbol": "star",
            "city": "Washington, D.C."
        }
    }, {
        type: 'Feature',
        "geometry": {
            "type": "Point",
            "coordinates": [-87.63, 41.88]
        },
        "properties": {
            "image": "http://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Chicago_sunrise_1.jpg/640px-Chicago_sunrise_1.jpg",
            "url": "http://en.wikipedia.org/wiki/Chicago",
            "city": "Chicago"
        }
    }, {
        type: 'Feature',
        "geometry": {
            "type": "Point",
            "coordinates": [-74.00, 40.71]
        },
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
            var popupContent = '<h2>' + feature.properties.city + '</h2>';

            // http://leafletjs.com/reference.html#popup
            marker.bindPopup(popupContent, {
                closeButton: false,
                minWidth: 320
            });

        });
    });

    map.setView([4.5980478, - 74.0760867], 6);

    setTimeout(getData, 2000);

    function getData() {
        /*$.getJSON('/nocheyniebla/ubicaciones/antioquia.geojson', function(data) {
            var circles = data.geometry.coordinates.map(function(c) {
                return L.circle(c.reverse(), 200).addTo(map)
            });

            // L.layerGroup(circles).addTo(map);
        });*/

        $.getJSON('/colombia.json', function(data) {
	    console.log(data)
            geojson = L.geoJson(data, {
                style: style,
                onEachFeature: onEachFeature
            }).addTo(map);
        });
    }

    function highlightFeature(e) {
        var layer = e.target;

        layer.setStyle({
            weight: 3,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7
        });

        if (!L.Browser.ie && !L.Browser.opera) {
            layer.bringToFront();
        }

//        info.update(layer.feature.properties);
    }

    var geojson;

    function resetHighlight(e) {
        geojson.resetStyle(e.target);
//        info.update();
    }

    function zoomToFeature(e) {
        map.fitBounds(e.target.getBounds());
    }

    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: zoomToFeature
        });
    }

    // get color depending on population density value
    function getColor(d) {
	console.log(d);
        return  d > 0.50 ? '#800026' : 
                d > 0.30 ? '#BD0026' : 
                d > 0.10 ? '#E31A1C' : 
                d > 0.08 ? '#FC4E2A' : 
                d > 0.06 ? '#FD8D3C' : 
                d > 0.04 ? '#FEB24C' : 
                d > 0.02 ? '#FED976' : '#FFEDA0';
    }

    function style(feature) {
        return {
            weight: 1,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.6,
            //fillColor: getColor(feature.properties.Shape_Area)
            fillColor: getColor(0.25)
        };
    }


});