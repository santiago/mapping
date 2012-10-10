/*  @module Layout
 *  @exports function
 */
define(function() {
    var TopNav = new(function _TopNav() {
        /*$('#top-nav a.action').click(function(e) {
            e.preventDefault();
            $(this).blur();
            var action = $(this).attr('class').replace(/action|on/g, '');
            action = $.trim(action);
            CardSlider.show(action);
            $('#top-nav a.action.on').removeClass('on');
            $(this).addClass('on');
        });*/
    });

    var CardSlider = new(function _CardSlider() {})();

    CardSlider.constructor.prototype.show = function(card) {
        if ($('.rslide-card.active').hasClass(card)) {
            return false;
        }

        $('.bg-rslide-card, .rslide-card.active').animate({
            'right': '-450'
        }, function() {
            if ($(this).hasClass('bg-rslide-card')) {
                return false;
            }
            $('.bg-rslide-card, .rslide-card.' + card).animate({
                'right': '0'
            }).addClass('active');
        }).removeClass('active');
    };
    
    return {
        TopNav: TopNav,
        CardSlider: CardSlider
    }
});