var path = require('path');
var express = require('express');
var app = express();

app.use( '/public', express.static('public') );
app.use( '/bower_components', express.static('bower_components') );
app.get( '/', function (req, res) {
    res.sendFile( path.join( __dirname, './index.html' ) );
});

var port = process.env.PORT || 8080;

app.listen( port, function () {
    console.log( 'Schedule app listening on port ' + port );
});