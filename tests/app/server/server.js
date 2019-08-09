/**
 * server.js
 */
var urlParse = require('url-parse');

var fs = require('fs');
var path = require('path');
var utils79 = require('utils79');
var express = require('express'),
	app = express();
var server = require('http').Server(app);

app.use( require('body-parser')({"limit": "1024mb"}) );
app.use( '/common/gitui79/', express.static( path.resolve(__dirname, '../../../dist/') ) );
app.use( '/common/gitparse79/', express.static( path.resolve(__dirname, '../../../node_modules/gitparse79/dist/') ) );
app.use( '/apis/git', function(req, res, next){
	console.log(req);
	console.log(req.method);
	console.log(req.body);
	console.log(req.originalUrl);
	return;
} );

app.use( express.static( __dirname+'/../client/' ) );

// 3000番ポートでLISTEN状態にする
server.listen( 3000, function(){
	console.log('server-standby');
} );
