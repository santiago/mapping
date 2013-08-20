$(function() {
    var session_id = $('meta[name=session_id]').attr('value');
    var WebSocketRPC = InitWebSocketRPC(WebSocket);
    var ws = new WebSocketRPC('ws://' + window.location.host+'/');
    
    // Identify this client to the WS server
    ws.on('open', function() {
        ws.message('session_id', session_id);
    });

    function prepareTags() {
        var termClass = $('ul.terms').length > 0 ? '.term' : '.user'; 

        $("ul.tagging").tagit({
            beforeTagAdded: function(evt, ui) {
                if (!ui.duringInitialization) {
                    var term = $(this).closest('li').find(termClass).text().trim().toLowerCase();
                    var tag = $(ui.tag).find('[name=tags]').val().trim().replace(/\s/, '-');
                    ws.message('add_tags', term, tag);
                }
            },
            beforeTagRemoved: function(evt, ui) {
                var term = $(this).closest('li').find(termClass).text().trim().toLowerCase();
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
            "analysis": "analysis",
            "segmentation": "segmentation",
            "segmentation?:params": "segmentation"
        },

        trending: function(q) {
            goTo('trending', trending);
        },
        
        following: function(q) {
            goTo('following', following);
        },
        
        analysis: function(q) {
            goTo('analysis', analysis);
        },
        
        segmentation: function(params) {
            goTo('segmentation', params, segmentation);
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
            $(this).attr('disabled', '');
            $(this).removeClass('btn-primary');
            $(this).text('Synching ...');
            $.post('/twitter/stream/sync', function() {
                goTo('following', following);
            });
        });
    }

    function analysis() {
    }

    function segmentation(data) {
        $("#mode-nav button").click(function(e) {
            e.preventDefault();
            var mode = $(this).attr('mode');
            var tag = $(this).closest('.panel').find('h3.panel-title').text().trim();
            goTo('segmentation', { tag: tag, m: mode }, segmentation);
        });
    }
    
    function goTo(section, params, cb) {

        var query = {
            'function': function() {
                cb = params;
                return '';
            },
            'object': function() {
                var q = '?'
                for(var p in params) {
                    q += p+"="+params[p]+'&';
                }
                return q;                
            },
            'string': function() {
                return (params ? '?'+params : '');
            }
        }[typeof (params||'')]();
        

        $.get('/twitter/stream/'+section+query, function(data) {
            $('.tab-content #'+section).html(data);
            prepareTags();
            $('a[href="#'+section+'"]').tab('show');
            cb(data);
        });        
    }
});