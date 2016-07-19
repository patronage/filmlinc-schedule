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

            _.forEach( rawData, function( event ) {
                var start = moment( event.start );
                var end = moment( event.end );
                duration = end.diff( start, 'minutes' )
                event.lengthInMinutes = duration;
            });

            groupedData = _.groupBy( rawData, function( event ) {
                return moment( event.start ).format( DATE_KEY_FORMAT );
            });

            callback();
        }
    })
}

function checkPast( dateToCheck ) {
    var now = new moment();
    return dateToCheck.isBefore( now );
};

function buildCalendar() {

    $('#calendar').fullCalendar({
        schedulerLicenseKey: '0709072040-fcs-1468865905',
        defaultView: 'timelineDay',
        slotDuration: '00:10',
        resourceLabelText: ' ',
        header: {
            left: 'title',
            center: '',
            right: ''
        },
        timezone: 'local',
        height: 'auto',
        minTime: moment( groupedData[ selectedDate ][ 0 ].start ).format( 'HH:mm:00' ),
        maxTime: moment( groupedData[ selectedDate ][ groupedData[ selectedDate ].length - 1 ].end ).format( 'HH:mm:00' ),
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
        },
        eventAfterRender: function(event, element, view) {

            var $interior = element.find( '.fc-content' );

            // Add event section data
            if ( event.section ) {
                var eventSectionSlug = slugifyText( event.section );
                $( element ).attr( 'data-section', eventSectionSlug );
                $( element ).addClass( eventSectionSlug );
            }

            var isEventPast = checkPast( event.start );
            // Was event in the past?
            if ( isEventPast ) {
                $( element ).attr( 'href', '#' );
                $( element ).on( 'click', function( e ) {
                    e.preventDefault();
                });
                $( element ).addClass( 'fc-event-past' );
            }

            // Add section and meta info
            element.append( '<div class="fc-callout">' + event.section + '</div>' );
            $interior.prepend( '<span class="fc-section">' + event.section + '</span>' );
            $interior.append( '<span class="fc-duration">' + event.lengthInMinutes + 'minutes</span>' );
            if ( !isEventPast ) {
                $interior.after(
                    '<div class="fc-meta">' +
                        '<span class="fc-meta-time">' +
                        moment( event.start ).format( 'hh:mm A') +
                        '</span>' +
                        '<span class="fc-meta-buy"><a href="' + event.url +'">Buy Tickets</a></span>' +
                    '</div>'
                );
            }

        },
        eventAfterAllRender: function() {

            var sections = _.uniq( rawData, function( event ) {
                return event.section;
            });

            _.forEach( sections, function( event ) {
                if ( typeof event.section != 'undefined'  &&  event.section != 'FREE EVENTS' ) {
                    var section = event.section;
                    var sectionHyphenated = slugifyText( section );
                    $('.filter-col--sections ul').append( '<li><a class="cal-filter-trigger" href="#" data-section=' + sectionHyphenated + '>' + section + '</a></li>' )
                }
            });
        },
        viewRender: function( view, element ) {
            var els = $( '.fc-major' );
            _.forEach(els, function( el, index ) {
                if ( index % 2 === 0 ) {
                    $( el ).addClass( 'fc-major--even' );
                }
            });
            $( '.fc-major--even' ).prev().addClass( 'fc-minor--colored' );
            $( '.fc-major--even' ).prev().prev().addClass( 'fc-minor--colored' );
            $( '.fc-major--even' ).prev().prev().prev().addClass( 'fc-minor--colored' );

            $( '.fc-major--even' ).next().addClass( 'fc-minor--colored' );
            $( '.fc-major--even' ).next().next().addClass( 'fc-minor--colored' );

            // Make the main window draggable
            // var $draggable = $( '.fc-scroller-canvas' ).draggabilly({
            //     axis: 'x',
            //     grid: [ 90, 100 ]
            // });
            // $draggable.draggabilly( 'enable' );
        }
    });

}

jQuery(document).ready(function() {

    getData( function() {
        buildCalendar();
    });

});