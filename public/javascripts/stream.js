$(function() {
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
    
    $('#stream-nav a').click(function(e) {
        e.preventDefault();
        var $clicked = $(this);
        var section = $(this).attr('href').replace(/#/, '');
        $.get('/twitter/stream/'+section, function(data) {
            $('.tab-content #'+section).html(data);
            $clicked.tab('show');
        });
    });
});