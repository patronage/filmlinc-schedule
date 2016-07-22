// var groupedData;
// var userSelectedDate;
function buildList() {

    var data = groupedData[ userSelectedDate ];
    var $list = $( '.widget__list' );

    // empty the list out before we add items
    $list.empty();

    _.forEach( data, function( event ) {

        var venuesToModify = [ "Howard Gilman Theater", "Amphitheater", "Francesca" ];
        var venueDescription = ' ';
        if ( venuesToModify.indexOf( event.venue_tess ) > -1 ) {
            venueDescription = 'Elinor Bunin Munroe Film Center';
        }

        var ticketStatus = '';
        if ( event.ticket_status && event.ticket_status !== 'normal' ) {
            ticketStatus = '<span class="list-row__actions__tooltip">' + event.ticket_status + '</span>';
        }

        var template = (
            '<div class="list-row" data-section="' + slugifyText( event.section ) + '">' +
                '<time class="list-row__time">' + moment( event.start ).format( 'h:mmA' ) + '</time>' +
                '<div class="list-row__title">' +
                    '<small>' + event.section + '</small>' +
                    '<p><a href="' + event.permalink + '">' + event.title + '</a></p>' +
                '</div>' +
                '<div class="list-row__location">' +
                    '<small>' + venueDescription + '</small>' +
                    '<p>' + event.venue_tess + '</p>' +
                '</div>' +
                '<div class="list-row__duration">' + event.running_time + ' mins</div>' +
                '<div class="list-row__actions">' +
                     ticketStatus +
                    '<a href="' + event.url + '">Buy Tickets</a>' +
                '</div>' +
            '</div>'
        );
        $list.append( template );

    });

}