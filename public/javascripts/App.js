requirejs.config({
    baseUrl: 'javascripts/modules',
    urlArgs: "bust=" + (new Date()).getTime()
});

// Start the main app logic.
requirejs(['Layout', 'MapBoxImpl', 'Mapping'], function(_Layout, _Map, _Mapping) {
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

    app.TopNav = TopNav;
    app.CardSlider = CardSlider;
    app.Map = _Map;

    var loggedIn = $('.account').length;

    var AppRouter = Backbone.Router.extend({
        routes: {
            "": "start",
            "_=_": "start",
            "login": "showLogin",
            "search": "showSearch"
        },
        
        start: function(id) {
            if (loggedIn) app.CardSlider.show('mis-mapas')
            else app.CardSlider.show('search')
        },
        
        showLogin: function() {
            app.CardSlider.show('login');
        },
        
        showSearch: function() {
            app.CardSlider.show('search');
        }
    });
    new AppRouter();

    var Mapping = _Mapping(app);

    Backbone.history.start();
});