// writes data with fake sections for development

var filePath = __dirname + '/../public/data.json';
var fs = require('fs');
var _ = require('lodash');
var data = require( filePath );

var opts = [
    'Potent potables',
    'One-letter words',
    'Words that rhyme with dog',
    'Drummers named ringo',
    'Colors that are red'
];

var length = opts.length - 1;
_.forEach( data, function( event ) {

    var randomNum = _.random( length );
    event.section = opts[ randomNum ];

});

fs.writeFileSync( filePath, JSON.stringify( data ) );
