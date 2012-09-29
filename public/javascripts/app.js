// Backbone Models
var Mapping = Backbone.Model.extend({
});

window.sidebar = new Sidebar;

sidebar.on('change:color', function(model, color) {
    $('#sidebar').css({background: color});
});

sidebar.set({color: 'white'});

sidebar.promptColor();


// Backbone Views
