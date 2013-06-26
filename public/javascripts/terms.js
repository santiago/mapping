$(function() {

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
        $('.exclude a').click(function(e) {
            e.preventDefault();
            var term = $(this).closest('li').find('.term').text().trim();

            $.post('/twitter/terms/exclude', { term: term }, function(data) {
                $('ul.terms').replaceWith(data);
                clickExclude();
            });
        });        
    }

});