var concat = require('concatenate-files');
var fs = require('fs');
var open = require('mac-open');
var UglifyJS = require('uglify-js');
var rimraf = require('rimraf');

var calendar = __dirname + '/../public/index.js';
var popup = __dirname + '/../public/popup.js';
var list = __dirname + '/../public/list.js';

var fileList = [
    calendar,
    popup,
    list
];

var thirdPartyFileList = [
    __dirname + '/../bower_components/jquery/dist/jquery.js',
    __dirname + '/../bower_components/moment/moment.js',
    __dirname + '/../bower_components/fullcalendar/dist/fullcalendar.js',
    __dirname + '/../bower_components/fullcalendar-scheduler/dist/scheduler.js',
    __dirname + '/../bower_components/lodash/lodash.js'
]

function concatDependencies() {
    concat( thirdPartyFileList, 'dist/nyffCalendarDeps.js', { separator: ';' }, function(err, result) {
        if ( err ) {
            console.log( err );
        } else {
            var compressed = UglifyJS.minify( __dirname + '/../dist/nyffCalendarDeps.js' );
            fs.writeFileSync( __dirname + '/../dist/nyffCalendarDeps.min.js', compressed.code, 'utf-8' );
            open( __dirname + '/../dist/' );
        }
    });
}

function concatScripts() {
    concat( fileList, 'dist/nyffCalendar.js', { separator: ';' }, function(err, result) {
        if ( err ) {
            console.log( err );
        } else {
            var compressed = UglifyJS.minify( __dirname + '/../dist/nyffCalendar.js' );
            fs.writeFileSync( __dirname + '/../dist/nyffCalendar.min.js', compressed.code, 'utf-8' );
            concatDependencies();
        }
    });
}

rimraf( __dirname + '/../dist', concatScripts )