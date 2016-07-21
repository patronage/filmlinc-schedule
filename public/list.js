// var groupedData;
// var userSelectedDate;
function buildList() {

    var data = groupedData[ userSelectedDate ];
    _.forEach( data, function( event ) {

        var venuesToModify = [ "Howard Gilman Theater", "Amphitheater", "Francesca" ];
        var venueDescription = ' ';
        if ( venuesToModify.indexOf( event.venue_tess ) > -1 ) {
            venueDescription = 'Elinor Bunin Munroe Film Center';
        }

        var template = (
            '<div class="list-row" data-section="' + slugifyText( event.section ) + '">' +
                '<time class="list-row__time">' + moment( event.start ).format( 'h:mmA' ) + '</time>' +
                '<div class="list-row__title">' +
                    '<small>' + event.section + '</small>' +
                    '<p>' + event.title + '</p>' +
                '</div>' +
                '<div class="list-row__location">' +
                    '<small>' + venueDescription + '</small>' +
                    '<p>' + event.venue_tess + '</p>' +
                '</div>' +
                '<div class="list-row__duration">' + event.lengthInMinutes + ' mins</div>' +
                '<div class="list-row__actions">' +
                    '<span class="list-row__actions__tooltip">Standby</span>' +
                    '<a href="' + event.url + '">Buy Tickets</a>' +
                '</div>' +
            '</div>'
        );
        $( '.widget__list' ).append( template );

    });

}