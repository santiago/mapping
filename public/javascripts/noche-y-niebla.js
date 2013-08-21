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

        var ubicacionesJSON = {};
        var ubicacionesCircles = {};
        
        function renderUbicaciones(_depto) {
            if(_depto) {
                var data = ubicacionesJSON[_depto];
                render(_depto, data);
                return;
            }

            Object.keys(ubicacionesJSON).forEach(function(depto) {
                if(ubicacionesJSON[depto]) { return; }
                var data = ubicacionesJSON[depto];
                render(depto, data);
            });
            
            function render(depto, data) {
                ubicacionesCircles[depto] = data.geometry.coordinates.map(function(c) {
                    return L.circle(c.reverse(), 200).addTo(map)
                });
                // L.layerGroup(circles).addTo(map);
            }
        }

        function getUbicaciones(depto) {
            depto = depto.replace(/\s/g, '\\ ');
            $.getJSON(encodeURI('/nocheyniebla/ubicaciones/'+depto+'.geojson'), function(data) {
                if(!ubicacionesJSON[depto]) {
                    ubicacionesJSON[depto] = data;
                    renderUbicaciones(depto);
                }
            });
        }
        
        function getDepto(depto) {
            getUbicaciones(depto);
            $("#"+depto+" .panel-depto").load(encodeURI('/nocheyniebla/ubicaciones/'+depto+'.html'), function() {
                var current = ($(".panel-collapse.in").attr("id")||'').replace(/\s/g, '\\ ')
                $(".panel-collapse.in").collapse("hide");
                current && $("#"+current).find("ul.list-group").remove();
                $("#"+depto).collapse("toggle");
            });
        }
        
        function onClickMapOn(e) {
            e.preventDefault();
            var depto = $(this).closest('li').find('.panel-title a').attr('href').replace('#', '');
            $(this).addClass('btn-success');
            $(this).removeClass('btn-default');
            getUbicaciones(depto);
            $(this).unbind('click');
            $(this).click(onClickMapOff);
        }
        
        function onClickMapOff(e) {
            e.preventDefault();
            var depto = $(this).closest('li').find('.panel-title a').attr('href').replace('#', '');
            
            ubicacionesCircles[depto].forEach(function(circle) {
                map.removeLayer(circle);
            });
            
            delete ubicacionesJSON[depto];
            $(this).removeClass('btn-success');
            $(this).addClass('btn-default');
            renderUbicaciones();          
            $(this).unbind('click');
            $(this).click(onClickMapOn);
        }
        
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
    }

});