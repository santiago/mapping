$(function() {
    var session_id = $('meta[name=session_id]').attr('value');
    var WebSocketRPC = InitWebSocketRPC(WebSocket);
    var ws = new WebSocketRPC('ws://' + window.location.host+'/');
    
    // Identify this client to the WS server
    ws.on('open', function() {
        ws.message('session_id', session_id);
    });

    // Click on main tabs    
//    $('#stream-nav a').click(function(e) {
//        e.preventDefault();
//        var $clicked = $(this);
//        var section = $(this).attr('href').replace(/#/, '');
//        $.get('/twitter/stream/'+section, function(data) {
//            $('.tab-content #'+section).html(data);
//            prepareTags();
//            $clicked.tab('show');
//        });
//    });

    function prepareTags() {
        $("ul.tagging").tagit({
            beforeTagAdded: function(evt, ui) {
                if (!ui.duringInitialization) {
                    var term = $(this).closest('li').find('.term').text().trim().toLowerCase();
                    var tag = $(ui.tag).find('[name=tags]').val().trim().replace(/\s/, '-');
                    ws.message('add_tags', term, tag);
                }
            },
            beforeTagRemoved: function(evt, ui) {
                var term = $(this).closest('li').find('.term').text().trim().toLowerCase();
                var tag = $(ui.tag).find('[name=tags]').val().trim().replace(/\s/, '-');
                ws.message('remove_tags', term, tag);
            }
        });
    }
    
    // Backbone Router for this component
    var Router = new (Backbone.Router.extend({
        routes: {
            "": "trending",
            "trending": "trending",
            "following": "following",
            "analysis": "analysis"
        },

        trending: function(q) {
            goTo('trending', function() {
                trending();
            });
        },
        
        following: function(q) {
            goTo('following', function() {
                following();
            });
        },
        
        analysis: function(q) {
            goTo('analysis', function() {
                analysis();
            });
        }
    }))();

    Backbone.history.start();
    
    function trending() {
        // Click on actions: follow, unfollow
        $('.action a').click(function(e) {
            e.preventDefault();
            
            var user = $(this).closest('.term-item').find('.term a').text();
            var action = $(this).attr('href');
            if(action == '#follow') {
                $.post('/twitter/stream/follow', { user: user }, function(data) {
                    console.log(data);
                });
            }
        });
    }
    
    function following() {
        $('#sync').click(function(e) {
            e.preventDefault();
            console.log('sync');
        });
    }
    
    function analysis() {
    }

    function goTo(section, cb) {
        $.get('/twitter/stream/'+section, function(data) {
            $('.tab-content #'+section).html(data);
            prepareTags();
            $('a[href="#"'+section+']').tab('show');
        });        
    }
});