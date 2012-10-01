var app = app || {};

$(function($) {

var TopNav = new (function _TopNav() {
    $('#top-nav a.action').click(function(e) {
        e.preventDefault();
        $(this).blur();
        var action = $(this).attr('class').replace(/action|on/g, '');
        action = $.trim(action);
        CardSlider.show(action);
        $('#top-nav a.action.on').removeClass('on');
        $(this).addClass('on');
    });
});

var CardSlider = new (function _CardSlider() {
})();

CardSlider.constructor.prototype.show = function(action) {
    if ($('.rslide-card.active').hasClass(action)) {
        return false;
    }
    
    $('.bg-rslide-card, .rslide-card.active').animate({
        'right': '-450'
    }, function() {
        if ($(this).hasClass('bg-rslide-card')) {
            return false;
        }
        $('.bg-rslide-card, .rslide-card.'+action).animate({
            'right': '0'
        }).addClass('active');
    }).removeClass('active');
};

var Mapping = Backbone.Model.extend({
    promptColor: function() {
        var cssColor = prompt("Please enter a CSS color:");
        this.set({color: cssColor});
    }
});

var MappingRouter = Backbone.Router.extend({
    routes: {
        "mapping/:id":  "getMappingById"
    },
    getMappingById: function(id) {
        View.getMappingById(id)
    }
});
new MappingRouter();

var MappingList = Backbone.Collection.extend({
    model: Mapping,
    url: '/mappings'
});

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
            data: { user_id: this.user_id },
            success: function(view, data) {
                $('ul.mappings').empty();
                data.forEach(function(item) {
                    dust.render('mapping_item', item, function(err, html) {
                        $('ul.mappings').append(html);
                    })
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
        if (!title) { return false }
        this.collection.create({
            title: title
        });
    },
    
    captureKey: function(e) {
        switch(e.keyCode) {
            case 13:
                this.createMapping();
                break;
            default:
                break;
        }
    },
    
    getMappingById: function(id) {
        console.log('getMappingById');
        console.log(id);
    }
});

var View = new MyMappingsView({
    collection: new MappingList
});

var Map = new (function _Map() {

    // The marker icon
    var size = new OpenLayers.Size(15, 24);
    var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
    var icon = new OpenLayers.Icon('/images/marker-3.png', size, offset);

    this.nodes = {};

    this.map = new OpenLayers.Map('map');
    var map = this.map;
    
    var lastMouseDown = [];
    
    $("#map").on('mousedown', function(e) {
        var point = map.getLonLatFromViewPortPx({
            x: e.offsetX,
            y: e.offsetY
        });
    
        point.transform(
            map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326")
        );
        
        lastMouseDown = [point.lat, point.lon];
    });

    $("#map").on('mouseup', function(e) {
        // Remove the annoying Google copyright popup
        $(".olLayerGooglePoweredBy.olLayerGoogleV3").hide();
    });
    
    map.events.register('move', this, function(e) {
        this._moved = true;
    });
    
    map.addControl(new OpenLayers.Control.LayerSwitcher());

    this._marking = false;

    var markers = new OpenLayers.Layer.Markers("Markers");
    map.addLayer(markers);

    var mousemove = function(e) {
        var point = map.getLonLatFromViewPortPx(e.xy);
        markers.addMarker(new OpenLayers.Marker(point, icon));
    }

    // map.events.register('mousemove', this, mousemove);
    map.events.register('click', this, function(e) {
        var point = map.getLonLatFromViewPortPx(e.xy);

        if (this._marking) {
            map.events.unregister('mousemove', this, mousemove);
            markers.addMarker(new OpenLayers.Marker(point, icon));
            this._marking = false;
            this._moved = false;

            $("#formbox input[name=latitude]").val(point.lat);
            $("#formbox input[name=longitude]").val(point.lon);
            $("#formbox .button").show();
            $("#formcontent .move-banner").hide();
        }
    });
    
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
    
    
}); // init closure