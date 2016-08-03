/* GLOBALS!!! */

var groupedData, rawEventData;

// should be set to bootstrap's small breakpoint.
var breakpointSmallMax = 991;

// our lovely calendar
var $calendar = $( '.widget__calendar' );

// clear filter button
var $clearButton = $( '.schedule-actions__filters--clear' );

// consistent date formatting for when we need a day
var DATE_KEY_FORMAT = 'MM-DD-YYYY';

// venues that need "Elinor Bunin Munroe Film Center" added
var venuesToModify = [ "Howard Gilman Theater", "Amphitheater", "Francesca Beale Theater" ];

// class for timeline events and list rows
var filterClass = 'has-filter-active';

// the currently selected date. defaults to today
var userSelectedDate = moment().format( DATE_KEY_FORMAT );

var sections = [
    "Potent potables",
    "Words that rhyme with dog",
    "Colors that are red",
    "One-letter words",
    "Drummers named ringo"
];

/* end globals */

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
            
            rawEventData = _.sortBy( data, function( event ) {
                return event.start;
            });

            _.forEach( rawEventData, function( event ) {
                var endTime = moment( event.start ).add( event.running_time, 'minutes' ).format();
                event.endUTC = endTime;
            });

            groupedData = _.groupBy( rawEventData, function( event ) {
                return moment( event.start ).format( DATE_KEY_FORMAT );
            });

            callback();
        }
    })
}

// Swap views
function changeView( nextView ) {
    $( 'body' ).attr( 'data-view', nextView );
    $( '.widget__calendar' ).toggleClass( 'is-hidden' );
    $( '.widget__list' ).toggleClass( 'is-hidden' );
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
}

// Handle events on the "clear filters" buttons
function activateFilterClearButton() {
    
    $clearButton.removeClass( 'hidden' );
    $clearButton.one( 'click', function() {
        $( 'body' ).removeClass( 'body-filter-active' );
        $( '.schedule-actions__filters .cal-filter-trigger.is-active' ).removeClass( 'is-active' );
        $( this ).addClass( 'hidden' );
        $( '.fc-timeline-event' ).removeClass( filterClass );
        $( '.list-row' ).removeClass( filterClass );
    });
}

function handleFilters( jqEl ) {
    var $target = jqEl;
    var section = $target.data( 'section' );
    var $timelineEventSelector = $( '.fc-timeline-event[ data-section="' + section + '" ]' );
    var $listRows = $( '.list-row[ data-section="' + section +'" ]' );

    $target.toggleClass( 'is-active' );
    $timelineEventSelector.toggleClass( filterClass );
    $listRows.toggleClass( filterClass );

    if ( $( '.cal-filter-trigger.is-active' ).length > 0 ) {
        $( 'body' ).addClass( 'body-filter-active' );
        activateFilterClearButton();
    } else {
        $( 'body' ).removeClass( 'body-filter-active' );
        $clearButton.addClass( 'hidden' );
    }
}

function resetFilters() {
    $( 'body' ).removeClass( 'body-filter-active' );
    $( '.list-row.has-filter-active' ).removeClass( 'has-filter-active' );
    $( '.schedule-actions__dropdown--cont li' ).removeClass( 'is-active' );
}

function isSmall() {
    
    if ( $( document ).width() < breakpointSmallMax ) {
        return true;
    }
    return false;
}

function bindEvents() {

    // handle change between calendar and list views
    $( '.schedule-actions__view__button' ).on( 'click', function( e ) {
        e.preventDefault();
        if ( $( this ).hasClass( 'is-active' ) ) {
            return;
        } else {
            var view = $( this ).data( 'view' );
            $( '.schedule-actions__view__button.is-active' ).removeClass( 'is-active' );
            $( this ).addClass( 'is-active' );
            changeView( view );
        }
    });

    // handle the section filters
    $( '.cal-filter-trigger' ).on( 'click', function( e ) {
        e.preventDefault();
        var $this = $( this );
        handleFilters( $this );
    });

    // handle changing days
    $( '.day-picker' ).on( 'click', '.day-picker__day', function() {

        var selectedDay = $( this ).data( 'day' );
        if ( selectedDay !== userSelectedDate ) {
            $( '.day-picker__day.is-active' ).removeClass( 'is-active' );
            $( this ).addClass( 'is-active' );
            userSelectedDate = selectedDay;
            buildList();
            if ( !isSmall() ) {
                refreshCalendar();
            } else {
                resetFilters();
            }
        }
    });

    $( '.schedule-actions__dropdown li' ).on( 'click', function() {
        $( this ).toggleClass( 'is-active' );
    });

    $( '.schedule-actions__dropdown__title' ).on( 'click', function() {
        $( '.schedule-actions__dropdown' ).toggleClass( 'is-active' );
    });

    $( '.day-picker__pager--prev' ).on( 'click', function() {
        movePager( false );
    });

    $( '.day-picker__pager--next' ).on( 'click', function() {
        movePager( true );
    });

    $( '.schedule-actions__dropdown__button--cont button' ).on( 'click', function( e ) {
        e.preventDefault();
        updateFiltersBasedOnDropdown();
        $( '.schedule-actions__dropdown' ).removeClass( 'is-active' );
    });

    $( window ).on( 'resize', _.debounce( setDatePickerWidth, 150 ) );

}

function updateFiltersBasedOnDropdown() {

    var numEls = $( '.schedule-actions__dropdown--cont li.is-active' ).length;
    $( '.list-row' ).removeClass( filterClass );

    if ( numEls > 0 ) {
        $( 'body' ).addClass( 'body-filter-active' );
        $( '.schedule-actions__dropdown--cont li.is-active' ).each( function() {
            var $target = $( this );
            var section = $target.data( 'section' );
            var $listRowsSelector = $( '.list-row[ data-section="' + section +'" ]' );
            $listRowsSelector.addClass( filterClass );
        });
    } else {
        $( 'body' ).removeClass( 'body-filter-active' );
    }
}

function setDatePickerWidth() {
    if ( isSmall() ) {
        var pagerWidth = $( '.day-picker__pager' ).outerWidth();
        var numDays = $( '.day-picker__day' ).length;
        var width = $( '.day-picker__day' ).outerWidth();
        var containerWidth = numDays * width + ( pagerWidth * 2 );
        $( '.day-picker' ).css({
            paddingLeft: pagerWidth,
            paddingRight: pagerWidth,
            width: containerWidth
        });
    } else {
        $( '.day-picker' ).css({
            paddingLeft: 0,
            paddingRight: 0,
            width: 'auto'
        });
    }
}

function movePager( isMovingForward ) {
    var amountToMove;
    var dayWidth = $( '.day-picker__day' ).outerWidth();
    var currentlyTranslatedValue = parseInt( $( '.day-picker' ).css( 'transform' ).split(',')[4] ) || 0;

    if ( !isMovingForward ) {
        amountToMove = currentlyTranslatedValue + dayWidth;
        $( '.day-picker' ).css( 'transform', 'translateX(' + amountToMove + 'px )' );
    } else {
        amountToMove = currentlyTranslatedValue - dayWidth;
        $( '.day-picker' ).css( 'transform', 'translateX(' + amountToMove + 'px )' );
    }
}

function refreshCalendar() {
    $calendar.fullCalendar( 'refetchEvents' );
    
    var minTime = getEarliestTime();
    var maxTime = getLatestTime();
    
    $calendar.fullCalendar( 'option', {
        minTime: minTime,
        maxTime: maxTime
    });
    $calendar.fullCalendar( 'gotoDate', moment( userSelectedDate, DATE_KEY_FORMAT ) );
}

function getEarliestTime() {
    var format = 'HH:00:00';
    var firstEvent = _.sortBy( groupedData[ userSelectedDate ], function( event ) {
        return event.start;
    })[ 0 ]
    var startTime = moment( firstEvent.start ).format( format );
    return startTime;
}

function getLatestTime( data ) {
    var format = 'HH:mm:00';
    var sortedEvents = _.sortBy( groupedData[ userSelectedDate ], function( event ) {
        return event.end;
    });
    var lastEvent = sortedEvents[ sortedEvents.length - 1 ];
    var endTime = moment( lastEvent.end ).add( '30', 'minutes' ).format( format );
    return endTime;
}

// Gets time rounded down to nearest 10 minutes
// can be used with `scrollTime` http://fullcalendar.io/docs/timeline/scrollTime/
function getCurrentTimeToClosestTen() {
    var now = moment();
    var timeHours = now.format( 'HH' );
    var timeMinutes = now.format( 'mm' );
    timeMinutes += '';
    timeMinutes = timeMinutes.split('')[0];
    return timeHours + ':' + timeMinutes + '0:00';
}

function buildCalendar() {

    $calendar.fullCalendar({

        // http://fullcalendar.io/docs/views/defaultView/
        // http://fullcalendar.io/docs/views/Available_Views/
        defaultView: 'timelineDay',
        
        // http://fullcalendar.io/docs/display/header/
        header: {
            left: '',
            center: '',
            right: ''
        },

        // http://fullcalendar.io/docs/display/height/
        height: 'auto',

        // http://fullcalendar.io/docs/timeline/minTime_maxTime/
        minTime: getEarliestTime(),
        maxTime: getLatestTime(),

        // http://fullcalendar.io/docs/timeline/resourceAreaWidth/
        resourceAreaWidth: 198,

        // http://fullcalendar.io/docs/timeline/resourceLabelText/
        resourceLabelText: ' ',

        schedulerLicenseKey: '0709072040-fcs-1468865905',

        // http://fullcalendar.io/docs/timeline/scrollTime/
        scrollTime: moment().format('hh:mm:00'),

        // http://fullcalendar.io/docs/timeline/slotDuration/
        slotDuration: '00:10',
        
        // http://fullcalendar.io/docs/timeline/slotWidth/
        slotWidth: 35,

        // http://fullcalendar.io/docs/timezone/timezone/
        timezone: 'local',

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

            var $element = element;

            var $interior = element.find( '.fc-content' );
            var isEventPast = checkPast( event.start );
            var titleText = $element.find( '.fc-title' ).text();
            var eventSectionSlug, slug, readableDate;

            $element.attr({
                'data-slug': event.slug,
                'data-date': event.date_readable,
                'data-dateunix': event.start
            });

            // Add event section data
            if ( event.section ) {
                eventSectionSlug = slugifyText( event.section );
                $element.attr( 'data-section', eventSectionSlug );
            }

            // Was event in the past?
            if ( isEventPast ) {
                $element.attr( 'href', '#' );
                $element.on( 'click', function( e ) {
                    e.preventDefault();
                });
                $element.addClass( 'fc-event-past' );
            }

            // Convert HTML string into HTML
            $element.find( '.fc-title' ).html( titleText );

            // Add section and meta info
            $interior.prepend( '<span class="fc-section">' + event.section + '</span>' );
            $interior.append( '<span class="fc-duration">' + event.running_time + ' minutes</span>' );
            if ( !isEventPast ) {
                // if ( event.ticket_status && event.ticket_status !== 'normal' ) {
                if ( event.ticket_status ) {
                    element.append( '<div class="fc-callout">' + event.ticket_status + '</div>' );
                }
                $interior.after(
                    '<div class="fc-meta">' +
                        '<span class="fc-meta-time">' +
                        moment( event.start ).format( 'h:mm A') +
                        '</span>' +
                        '<span class="fc-meta-buy"><a href="' + event.url +'">Buy Tickets</a></span>' +
                    '</div>'
                );
            } else {
                $interior.after(
                    '<div class="fc-meta">' +
                        '<span class="fc-meta-time">' +
                        moment( event.start ).format( 'h:mm A') +
                        '</span>' +
                    '</div>'
                );
            }

            $element.on( 'click', function( e ) {

                cleanupPopup();

                var slug = $( this ).data( 'slug' );
                var unixDate = $( this ).data( 'dateunix' );

                //no slug? treat it as a link
                // if ( !slug ){
                //     window.location.href = $( this ).attr('href');
                // }

                if ( e.target.tagName !== 'A' ) {
                    popupGenerator( slug, unixDate );
                }
            });
        },

        resources: function( callback ) {

            var uniqueVenues = [
                'Alice Tully Hall',
                'Walter Reade Theater',
                'Francesca Beale Theater',
                'Howard Gilman Theater',
                'Amphitheater',
                'Bruno Walter Auditorium'
            ];

            uniqueVenues = _.map( uniqueVenues, function( venue ) {
                return {
                    id: slugifyText( venue ),
                    title: venue
                };
            });
            callback( uniqueVenues );
        },

        resourceRender: function( resourceObj, labelTds, bodyTds ) {
            var $resourceTextEl = $( labelTds ).find( '.fc-cell-text' );
            var venueName = $resourceTextEl.text();
            var template = (
                '<div class="fc-cell-text">' +
                    '<small>Elinor Bunin Munroe Film Center</small>' +
                    '<span>' + venueName + '</span>' +
                '</div>'
            );
            if ( venuesToModify.indexOf( venueName ) > -1 ) {
                $resourceTextEl.replaceWith( template );
            }

            $( labelTds ).on( 'click', function( e ) {
                venuePopupGenerator( venueName );
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

            $( '.fc-resource-area tr[data-resource-id]:not(:empty) .fc-cell-content' ).after( '<span class="fc-cell-content-bg"></span>' );
        }
    });
}

jQuery(document).ready(function() {

    $('body').attr({
        'data-view': ''
    });
    
    getData( function() {
        buildCalendar();
        buildList();
    });
    buildDayPicker();
    bindEvents();
    setDatePickerWidth();

});