var baseOffset = ( moment().isDST() ) ? -240 : -300;
var $modalCont = $( '.modal-cont' );

function cleanupPopup() {
    $modalCont.removeClass( 'is-active' );
    $modalCont.empty();
    $('.fc-week.has-active-event').removeClass('has-active-event');
    $('.fc-event.is-active').removeClass('is-active');
    $('.item-left').removeClass('item-left');
    $( '.fc-week' ).removeClass('child-item-fixed');
    $('.item-nudged-vertically').removeClass('item-nudged-vertically');
    $( document ).off( 'keyup ');
};

function popupGenerator( slug, dateUnix ) {

    var entry = _.find( rawEventData, {
        'slug': slug,
        'start': dateUnix
    });
    console.log( entry );

    //When showing just a "day" date, to prevent from changing days, don't factor in the new york
    //local offset
    var date = moment( entry.start ).clone().add( baseOffset, 'minutes' ).format('MMMM D');

    var entryUrl = '';

    if ( entry.festival_or_series ) {
        entryUrl = entry.url;
    } else {
        entryUrl =  entry.permalink;
    }

    // sketchy templating
    $('.co-img a').attr( 'href', entryUrl );
    $('.co-img img').attr( 'src', entry.thumb )
    $('.co-content h2').html( '<a href="' + entryUrl + '">' + entry.title + '</a>' );
    $('.co-content p').html( entry.desc );
    $('.co-content h3 span').text( date );

    // create showtimes list if applicable
    var listString = '';
    _.forEach( entry.showtimes, function( time ) {
        listString += '<li><a href="' + time.url + '">' + moment( time.start ).formatToZone( 'h:mma' ) + '</a></li>';
    });
    $('.co-showtimes-list').html( listString );

    var cloned = $('.co').clone();
    $modalCont.addClass( 'is-active' );
    $modalCont.html( cloned );

    $('.fc-week .co-closer').one( 'click', function( e ) {
        e.preventDefault();
        cleanupPopup();
    });

    $(document).on( 'keyup', function(e) {
        if (e.keyCode == 27) {
            cleanupPopup();
        }
    });
};