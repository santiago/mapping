var app = app || {};

$(function($) {
    
var AppView = Backbone.View.extend({
    tagName: "#map",

    className: "document-row",

    events: {
        "click .icon": "open",
        "click .button.edit": "openEditDialog",
        "click .button.delete": "destroy"
    },

    render: function() {
    }
});

function init(opts) {
    startUi.call();
    
    new MyMappingsView({ user_id: 'santiago' });
    
    $("#formbox .button.mapme").click(function() {
        var data = RegisterForm.getValidData({
            exclude: ['latitude', 'longitude']
        });
        if (data) {
            map.events.register('mousemove', self, mousemove);
            self._marking = true;
            $("#formbox .button").hide();
            $("#formcontent .move-banner").show();
        }
    });
}


// init private methods
function startUi() {
    var self = this;

    $("header .user").text(this.userId);

    // Click on .name at node-item
    $("#node-list .node-item .name a").on('click', function(e) {
        e.preventDefault();
        $(this).blur();
        var id = $(this).closest('.node-item').attr('id').split('-')[2];
        $.get('/data/node/' + id + '.html', function(data) {
            $(".rslide-card.node-list").animate({
                "right": "-450"
            })
            $(".rslide-card.node-front").html(data);
            $("#node-" + id).show();
            var lonlat = [self.nodes[id].longitude, self.nodes[id].latitude];
            var point = new OpenLayers.LonLat(lonlat[0], lonlat[1])
            self.map.panTo(point);

            $(".rslide-card.node-front").animate({
                "right": "0"
            }, function() {
                $(".rslide-card.active").removeClass("active");
                $(".rslide-card.node-front").addClass("active");
            })
        });
    });
}

var app = new init();

}); // init closure
