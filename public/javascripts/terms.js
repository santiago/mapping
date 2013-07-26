$(function() {
    function TermsBrowser() {
        this.renderPath();        
    }
    
    TermsBrowser.prototype.renderPath = function() {
        this.readPath();

        var path = this.path[0];

        if(path) {
            var $li = $('<li class="active"><a href="#">'+path+'</a></li>');
            // $li.append('<span>&nbsp;>&nbsp;</span>');
            
            $('ul.nav').empty().append($li);
        }
    };

    TermsBrowser.prototype.readPath = function() {
        this.path = [];
        
        var hash = location.hash.replace(/#!\//, '');
        var query = decodeURI(hash).split('=');
        var params = {};
        while(query.length) {
            var p = query.shift();
            params[p] = query.shift();
        }
        
        if(params.p) {
            this.path = params.p.split(',').map(function(t) { return t.trim() });
        }
    };

    TermsBrowser.prototype.search = function() {
        var type = location.pathname.split('/')[2];
        var q = encodeURI(this.path.join(' '));

        $.get('/twitter/'+type+'/search', { q: q }, function(data) {
            console.log(data);
            $('ul.terms').replaceWith(data);
            clickExclude();
            this.renderPath();
        }.bind(this));
    };
    
    var termsBrowser = new TermsBrowser();

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
                termsBrowser.search();
            }
        });        
    }


    // Backbone Router for this component
    var Router = new (Backbone.Router.extend({
        routes: {
            "!/:search": "search"
        },

        search: function(q) {
            termsBrowser.path = q.split('=').slice(1);
            termsBrowser.search();
        }
    }))();

    Backbone.history.start();
});