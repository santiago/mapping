$(function() {
    var session_id = $('meta[name=session_id]').attr('value');
    var WebSocketRPC = InitWebSocketRPC(WebSocket);
    var ws = new WebSocketRPC('ws://' + window.location.host+'/');
    
    // Identify this client to the WS server
    ws.on('open', function() {
        ws.message('session_id', session_id);
    });

    ws.on('tags', function(term, tags) {
    });

    // Prepare click on 'exclude' link
    clickExclude();

    var path = (function() {
        location.search.split('&')
            .filter(function(q) {
                return q;
            });
    })();

    // Click to exclude term
    function clickExclude() {
        $("ul.tagging").tagit({
            beforeTagAdded: function(evt, ui) {
                if (!ui.duringInitialization) {
                    var term = $(this).closest('li').find('.term').text().trim();
                    var tag = $(ui.tag).find('[name=tags]').val().trim().replace(/\s/, '-');
                    ws.message('add_tags', term, tag);
                }
            },
            beforeTagRemoved: function(evt, ui) {
                var term = $(this).closest('li').find('.term').text().trim();
                var tag = $(ui.tag).find('[name=tags]').val().trim().replace(/\s/, '-');
                ws.message('remove_tags', term, tag);
            }
        });
        
        $('.action a').click(function(e) {
            e.preventDefault();
            
            var term = $(this).closest('li').find('.term').text().trim();
            var type = location.pathname.match('terms') ? 'terms' : 'shingles';
            var exc_inc = $(this).attr('href');
            var url = '/twitter/'+type+'/exclude';
            
            $.ajax({
                url: url,
                type: exc_inc == 'exclude' ? 'POST' : 
                     (exc_inc == 'include' ? 'DELETE' : 'POST'),
                data: { term: term },
                success: success
            });

            function success(data) {
                $('ul.terms').replaceWith(data);
                clickExclude();
            }
        });        
    }
    
    function TermsBrowser() {
        this.path = [];
        
        var hash = location.hash.replace(/#/, '');
        var query = decodeURI(hash).split('=');
        var params = {};
        while(query.length) {
            var p = query.shift();
            params[p] = query.shift();
        }
        
        if(params.p) {
            this.path = params.p.split(',').map(function(t) { return t.trim() });
        }
        
        this.search();
    }
    
    TermsBrowser.prototype.search = function() {
        $.get('/twitter/terms/search', { q: this.path.join(' ') }, function(data) {
            $('ul.terms').replaceWith(data);
            clickExclude();
        });
    }
    
    var termsBrowser = new TermsBrowser();
});