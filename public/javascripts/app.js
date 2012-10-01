var app = app || {};
$(function($) {

var AppView = Backbone.View.extend({
});
app.AppView = new app.AppView;

$('.current-mapping').css({ left: $(window).width()/2 - $('.current-mapping').width()/2 });

Backbone.history.start();

}); // init closure
