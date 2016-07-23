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

    // put together our "template"
    $( '.co-content' ).attr( 'data-section', slugifyText( entry.section ) );
    $( '.co-img a' ).attr( 'href', entryUrl );
    $( '.co-img img' ).attr( 'src', '//filmlinc.org/' + entry.event_thumb )
    $( '.co-content__section' ).text( entry.section ).attr( 'data-section', slugifyText( entry.section ) );
    $( '.co-content__title' ).html( '<a href="' + entryUrl + '">' + entry.title + '</a>' );
    $( '.co-content__duration' ).text( entry.running_time + ' minutes' );
    $( '.co-content__description' ).html( entry.event_desc );
    $( '.co-content__location' ).text( entry.venue_tess );

    var time = moment( event.start ).format( 'h:mmA' )
    var date = moment( event.start ).format( 'MMMM D' );
    $( '.co-content__showtime time' ).text( time + ' on ' + date );
    $( '.co-content__showtime a' ).attr( 'src', entry.url );


    // create showtimes list if applicable
    var listString = '';
    _.forEach( entry.showtimes, function( time ) {
        listString += '<li><a href="' + time.url + '">' + moment( time.start ).formatToZone( 'h:mma' ) + '</a></li>';
    });
    $('.co-showtimes-list').html( listString );

    var cloned = $('.co').clone();
    $modalCont.addClass( 'is-active' );
    $modalCont.html( cloned );

    $( '.modal-cont .co' ).on( 'click', function( e ) {
        e.stopPropagation();
    });

    $( '.modal-cont' ).one( 'click', function( e ) {
        cleanupPopup();
    });

    $('.modal-cont .co-closer').one( 'click', function( e ) {
        e.preventDefault();
        cleanupPopup();
    });

    $( document ).on( 'keyup', function(e) {
        if (e.keyCode == 27) {
            cleanupPopup();
        }
    });
};