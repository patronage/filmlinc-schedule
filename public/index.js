var DATE_KEY_FORMAT = 'MM-DD-YYYY';
var selectedDate = moment().format( DATE_KEY_FORMAT );
var groupedData, rawData;

// via: https://gist.github.com/furzeface/01cf2b3ee8a737e8a55b
function slugifyText( text ) {
    var slug = text.replace(/[^\w\s]+/gi, '').replace(/ +/gi, '-');
    return slug.toLowerCase();
};

function getData( callback ) {
    $.ajax({
        url: './data.json',
        dataType: 'json',
        success: function( data, textStatus, jqXHR ) {
            rawData = _.sortBy( data, function( event ) {
                return event.start;
            });
            groupedData = _.groupBy( rawData, function( event ) {
                return moment( event.start ).format( DATE_KEY_FORMAT );
            });
            callback();
        }
    })
}

function buildCalendar() {

    $('#calendar').fullCalendar({
        schedulerLicenseKey: '0709072040-fcs-1468865905',
        defaultView: 'timelineDay',
        slotDuration: '00:10',
        header: {
            left: 'title',
            center: '',
            right: ''
        },
        // height: 'auto',
        // minTime: moment( groupedData[ selectedDate ][ 0 ].start ).format( 'HH:mm:00' ),
        minTime: '16:00:00',
        resources: function( callback ) {
            var uniqueVenues = _.map( _.uniqBy( rawData, function( event ) {
                return event.venue_tess;
            }), function( event ) {
                return event.venue_tess;
            });

            // remove any `undefined`
            uniqueVenues = _.filter( uniqueVenues, function( venue ) {
                return typeof venue === 'string';
            });

            uniqueVenues = _.map( uniqueVenues, function( venue ) {
                return {
                    id: slugifyText( venue ),
                    title: venue
                };
            });
            callback( uniqueVenues );
        },
        events: function( start, end, timezone, callback ) {
            var eventsFormatted = _.map( groupedData[ selectedDate ], function( event ) {
                if ( typeof event.venue_tess !== 'undefined' ) {
                    return Object.assign( {}, event, {
                        resourceId: slugifyText( event.venue_tess )
                    });
                }
            });

            eventsFormatted = _.filter( eventsFormatted, function( event ) {
                return typeof event !== 'undefined';
            });

            callback( eventsFormatted );
        }
    });

}

getData( function() {
    buildCalendar();
});