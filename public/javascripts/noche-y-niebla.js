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

        function getUbicaciones(depto) {
            $.getJSON(encodeURI('/nocheyniebla/ubicaciones/'+depto+'.geojson'), function(data) {
                var circles = data.geometry.coordinates.map(function(c) {
                    return L.circle(c.reverse(), 200).addTo(map)
                });
                // L.layerGroup(circles).addTo(map);
            });
        }
        
        // Backbone Router for this component
        var Router = new (Backbone.Router.extend({
            routes: {
                ":depto": function(depto) {
                    depto = depto.replace(/\s/g, '\\ ')
                    console.log(depto);
                    getUbicaciones(depto);
                    $("#"+depto+" .panel-depto").load(encodeURI('/nocheyniebla/ubicaciones/'+depto+'.html'), function() {
                        var current = ($(".panel-collapse.in").attr("id")||'').replace(/\s/g, '\\ ')
                        $(".panel-collapse.in").collapse("hide");
                        current && $("#"+current).find("ul.list-group").remove();
                        $("#"+depto).collapse("toggle");
                    });
                }
            }
        }))();
        
        Backbone.history.start();
    }

});