var path = require('path');
var express = require('express');
var app = express();

app.use( '/public', express.static('public') );
app.use( '/bower_components', express.static('bower_components') );
app.get( '/', function (req, res) {
  res.sendFile( path.join( __dirname, './index.html' ) );
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});