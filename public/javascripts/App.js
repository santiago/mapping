requirejs.config({
    baseUrl: 'javascripts/modules'
});

// Start the main app logic.
requirejs(['Layout', 'Mapping'], function(_Layout, _Mapping) {
    var TopNav = _Layout.TopNav;
    var CardSlider = _Layout.CardSlider;

    var app = new(Backbone.View.extend({
        el: window,

        initialize: function() {},

        setMappingName: function(name) {
            $('.current-mapping').css({
                left: $(window).width() / 2 - $('.current-mapping').width() / 2
            });
            $('.current-mapping').text('[ ' + name + ' ]');
        }
    }));

    var AppRouter = Backbone.Router.extend({
        routes: {
            "": "start",
            "_=_": "start"
        },
        start: function(id) {
            window.location.href = '#mappings';
        }
    });
    new AppRouter();

    var Mapping = _Mapping(app);

    Backbone.history.start();
});