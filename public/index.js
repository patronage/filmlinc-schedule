var $calendar = $( '#calendar' );
var DATE_KEY_FORMAT = 'MM-DD-YYYY';
var groupedData, rawData;
var userSelectedDate = moment().format( DATE_KEY_FORMAT );

// via: https://gist.github.com/furzeface/01cf2b3ee8a737e8a55b
function slugifyText( text ) {
    var slug = text.replace(/[^\w\s]+/gi, '').replace(/ +/gi, '-');
    return slug.toLowerCase();
};

// get event data and format it for scheduler
function getData( callback ) {
    $.ajax({
        url: '/public/data.json',
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

// see if event is in the past
function checkPast( dateToCheck ) {
    var now = new moment();
    return dateToCheck.isBefore( now );
}

// create list of days and bind events to them
function buildDayPicker() {
    
    var now = moment();
    
    for (var i = 0; i < 17; i++) {

        var pastDate = moment().subtract( 7, 'days' );
        var dateToWrite = pastDate.add( i, 'days' );

        $( '.day-picker' ).append(
            '<div class="day-picker__day" data-day=' + dateToWrite.format( DATE_KEY_FORMAT ) +'>' +
                '<span class="day-picker__day--name">' + dateToWrite.format( 'ddd' ) + '</span>' +
                '<span class="day-picker__day--date">' + dateToWrite.format( 'DD' ) + '</span>' +
            '</div>'
        );

        // Current day should be active
        if ( dateToWrite.format( DATE_KEY_FORMAT ) === now.format( DATE_KEY_FORMAT ) ) {
            $( '.day-picker__day' ).last().addClass( 'is-active' );
        }
    }

    // Bind events
    $( '.day-picker__day' ).on( 'click', function() {

        var selectedDay = $( this ).data( 'day' );
        if ( selectedDay !== userSelectedDate ) {
            $( '.day-picker__day.is-active' ).removeClass( 'is-active' );
            $( this ).addClass( 'is-active' );
            userSelectedDate = selectedDay;
            $calendar.fullCalendar( 'refetchEvents' );
            
            var minTime = moment( groupedData[ userSelectedDate ][ 0 ].start ).format( 'HH:mm:00' );
            var maxTime = moment( groupedData[ userSelectedDate ][ groupedData[ userSelectedDate ].length - 1 ].end ).format( 'HH:mm:00' );
            
            $calendar.fullCalendar( 'option', {
                minTime: minTime,
                maxTime: maxTime
            });
            $calendar.fullCalendar( 'gotoDate', moment( userSelectedDate, DATE_KEY_FORMAT ) );

        }

    });
}

// Builds the section selector buttons and binds events
function buildSectionButtons() {

    var sections = _.groupBy( rawData, function( event ) {
        return event.section;
    });
    sections = Object.keys( sections );

    _.forEach( sections, function( section ) {
        if ( typeof section !== 'undefined' ) {
            $('.schedule-actions ul').append( '<li><a class="cal-filter-trigger" href="#" data-section=' + slugifyText( section ) + '>' + section + '</a></li>' )
        }
    });

    $( '.cal-filter-trigger' ).on( 'click', function( e ) {
        
        var section = $( this ).data( 'section' );
        e.preventDefault();

        if ( !$( this ).hasClass( 'is-active' ) ) {
            $( '.cal-filter-trigger' ).removeClass( 'is-active' );
            $( this ).addClass( 'is-active' );
            $( 'body' ).attr( 'data-section', section );
            updateFilterDisplay( section );
        }

        activateFilterClearButton();
    });
}

function updateFilterDisplay( section ) {
    var filterClass = 'has-filter-active';
    $( '.fc-timeline-event' ).removeClass( filterClass );
    $( '.fc-timeline-event[ data-section="' + section + '" ]' ).addClass( filterClass );
}

// Handle events on the "clear filters" button
function activateFilterClearButton() {
    var $clearButton = $( '.schedule-actions__filters--clear' );
    $clearButton.removeClass( 'hidden' );
    $clearButton.one( 'click', function() {
        $( 'body' ).attr( 'data-section', '' );
        $( '.schedule-actions__filters .cal-filter-trigger.is-active' ).removeClass( 'is-active' );
        $( this ).addClass( 'hidden' );
    });
}

function bindEvents() {

    $( '.schedule-actions__view__button' ).on( 'click', function( e ) {
        e.preventDefault();
        if ( $( this ).hasClass( 'is-active' ) ) {
            return;
        } else {
            $( '.schedule-actions__view__button.is-active' ).removeClass( 'is-active' );
            $( this ).addClass( 'is-active' );
            var view = $( this ).data( 'view' );
            console.log( 'New view: ' + view );
        }
    });
}

function buildCalendar() {

    $calendar.fullCalendar({
        schedulerLicenseKey: '0709072040-fcs-1468865905',
        defaultView: 'timelineDay',
        slotDuration: '00:10',
        // slotWidth: 45,
        // resourceAreaWidth: "25%",
        resourceLabelText: ' ',
        header: {
            left: '',
            center: '',
            right: ''
        },
        timezone: 'local',
        height: 'auto',
        minTime: moment( groupedData[ userSelectedDate ][ 0 ].start ).format( 'HH:mm:00' ),
        maxTime: moment( groupedData[ userSelectedDate ][ groupedData[ userSelectedDate ].length - 1 ].end ).format( 'HH:mm:00' ),
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
            var eventsFormatted = _.map( groupedData[ userSelectedDate ], function( event ) {
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
                // $( element ).addClass( eventSectionSlug );
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

            // Convert HTML string into HTML
            var titleText = element.find( '.fc-title' ).text();
            element.find( '.fc-title' ).html( titleText );

            // Add section and meta info
            $interior.prepend( '<span class="fc-section">' + event.section + '</span>' );
            $interior.append( '<span class="fc-duration">' + event.lengthInMinutes + ' minutes</span>' );
            if ( !isEventPast ) {
                element.append( '<div class="fc-callout">' + event.section + '</div>' );
                $interior.after(
                    '<div class="fc-meta">' +
                        '<span class="fc-meta-time">' +
                        moment( event.start ).format( 'h:mm A') +
                        '</span>' +
                        '<span class="fc-meta-buy"><a href="' + event.url +'">Buy Tickets</a></span>' +
                    '</div>'
                );
            }

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

            $( '.fc-resource-area tr[data-resource-id]:not(:empty) .fc-cell-content' ).after( '<span class="fc-cell-content-bg"></span>' );

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

    $('body').attr({
        'data-section': '',
        'data-view': ''
    });
    
    buildDayPicker();
    getData( function() {
        buildCalendar();
        buildSectionButtons();
    });
    bindEvents();

});