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
                event.end = endTime;
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
    updateWidgetContainerHeight( nextView );
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
                '<span class="day-picker__day--date">' + dateToWrite.format( 'D' ) + '</span>' +
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

// check if a date time string is today
// accepts a `day` in a moment-compatible format
function isDayToday( day ) {
    var today = moment().startOf( 'day' );
    var day = moment( day ).startOf( 'day' );
    if ( day.isSame( today  ) ) {
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
        maxTime: maxTime,
        scrollTime: determineScrollTime()
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

function determineScrollTime() {
    if ( isDayToday( userSelectedDate ) ) {
        return getCurrentTimeToClosestTen();
    }
}

function updateWidgetContainerHeight( view ) {
    var height = $( '.fc-view-container' ).height() + $( '.day-picker__cont' ).height();
    if ( view === 'list' ) {
        height = $( '.widget__list' ).height() + $( '.day-picker__cont' ).height();
    }
    $( '.widgets' ).height( height );
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
        scrollTime: determineScrollTime(),

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
                        '<span class="fc-meta-buy"><a class="fc-meta-buy__link" href="' + event.url +'">Buy Tickets</a></span>' +
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

                e.preventDefault();
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

            $( '.fc-meta-buy__link' ).on( 'click', function( e ) {
                e.stopPropagation();
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

            updateWidgetContainerHeight();
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

});;var baseOffset = ( moment().isDST() ) ? -240 : -300;
var $modalCont = $( '.modal-cont' );

function cleanupPopup() {
    $modalCont.removeClass( 'is-active' );
    $modalCont.empty();
    $( document ).off( 'keyup ');
};

function popupGenerator( slug, dateUnix ) {

    var entry = _.find( rawEventData, {
        'slug': slug,
        'start': dateUnix
    });

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
    entry.directors.forEach( function( director ) {
        var currentText = $( '.co-content__directors' ).text();
        var newText = currentText + ', ' + director;
        $( '.co-content__directors' ).text( newText );
    })

    var time = moment( entry.start ).format( 'h:mmA' )
    var date = moment( entry.start ).format( 'MMMM D' );
    $( '.co-content__showtime time' ).text( time + ' on ' + date );
    $( '.co-content__showtime a' ).attr( 'src', entry.url );

    // create showtimes list if applicable
    var listString = '';
    _.forEach( entry.showtimes, function( time ) {
        listString += '<li><a href="' + time.url + '">' + moment( time.start ).formatToZone( 'h:mma' ) + '</a></li>';
    });
    $('.co-showtimes-list').html( listString );

    var cloned = $('.co').clone();
    var isEventPast = checkPast( moment( entry.start ) );
    if ( isEventPast ) {
        $( cloned ).find( '.co-content__showtime .button-compressed' ).remove();
    }
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

function venuePopupGenerator( venueName ) {

    var sampleVenue = {
        content: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ea sequi, architecto pariatur deleniti. Pariatur accusamus, sequi quis commodi neque eligendi.',
        address: '144 W 65th St. New York, NY 10023',
        directionsLink: 'https://www.google.com',
        image: '/public/images/shia.jpg'
    }

    // put together our "template"
    $( '.vm-img img' ).attr( 'src', sampleVenue.image )
    $( '.vm-content__title' ).text( venueName );
    $( '.vm-content__description' ).html( sampleVenue.content );
    $( '.vm-content__address address' ).text( sampleVenue.address );
    $( '.vm-content__address a' ).attr( 'src', sampleVenue.directionsLink );

    var cloned = $('.vm').clone();
    $modalCont.addClass( 'is-active' );
    $modalCont.html( cloned );

    // Show venue description if necessary
    if ( venuesToModify.indexOf( venueName ) > -1 ) {
        $modalCont.find( 'small' ).removeClass( 'hidden' );
    }

    $( '.modal-cont .vm' ).on( 'click', function( e ) {
        e.stopPropagation();
    });

    $( '.modal-cont' ).one( 'click', function( e ) {
        cleanupPopup();
    });

    $('.modal-cont .vm-closer').one( 'click', function( e ) {
        e.preventDefault();
        cleanupPopup();
    });

    $( document ).on( 'keyup', function(e) {
        if ( e.keyCode === 27 ) {
            cleanupPopup();
        }
    });
};;function buildList() {

    var data = groupedData[ userSelectedDate ];
    var $list = $( '.widget__list' );

    // empty the list out before we add items
    $list.empty();

    _.forEach( data, function( event ) {

        var venueDescription = ' ';
        if ( venuesToModify.indexOf( event.venue_tess ) > -1 ) {
            venueDescription = 'Elinor Bunin Munroe Film Center';
        }

        var ticketStatus = '<a href="' + event.url + '">Buy Tickets</a>';
        
        if ( event.ticket_status /*&& event.ticket_status !== 'normal'*/ ) {
            ticketStatus = (
                '<span class="list-row__actions__tooltip">' + event.ticket_status + '</span>' +
                '<a href="' + event.url + '">Buy Tickets</a>'
            );
        }

        if ( event.ticket_status && ( event.ticket_status === 'standby' || event.ticket_status === 'free' ) ) {
            ticketStatus = (
                '<span class="list-row__actions__tooltip">' + event.ticket_status + '</span>'
            );
        }

        var template = (
            '<div class="list-row" data-section="' + slugifyText( event.section ) + '">' +
                '<div class="list-row__time">' +
                    '<span class="list-row__actions__tooltip">' + event.ticket_status + '</span>' +
                    '<time>' + moment( event.start ).format( 'h:mmA' ) + '</time>' +
                '</div>' +
                '<div class="list-row__title">' +
                    '<small>' + event.section + '</small>' +
                    '<p><a href="' + event.permalink + '">' + event.title + '</a></p>' +
                    '<p class="list_row__title--venue hidden-md hidden-lg">' + event.venue_tess + '</p>' +
                '</div>' +
                '<div class="list-row__location hidden-sm hidden-xs">' +
                    '<small>' + venueDescription + '</small>' +
                    '<p>' + event.venue_tess + '</p>' +
                '</div>' +
                '<div class="list-row__duration hidden-sm hidden-xs">' + event.running_time + ' mins</div>' +
                '<div class="list-row__actions hidden-sm hidden-xs">' +
                     ticketStatus +
                '</div>' +
            '</div>'
        );
        $list.append( template );

    });

}