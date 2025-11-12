/**
 * server.js
 */
const fs = require('fs');
const path = require('path');
const utils79 = require('utils79');
const express = require('express'),
	app = express();
const server = require('http').Server(app);
const bodyParser = require('body-parser');

app.use( bodyParser({"limit": "1024mb"}) );
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());

app.use( '/common/gitui79/', express.static( path.resolve(__dirname, '../../../dist/') ) );
app.use( '/common/px2style/', express.static( path.resolve(__dirname, '../../../node_modules/px2style/dist/') ) );
app.use( '/common/bootstrap/', express.static( path.resolve(__dirname, '../../../node_modules/bootstrap/dist/') ) );
app.use( '/apis/git', function(req, res, next){
	// console.log(req);
	// console.log(req.method);
	// console.log(req.body);
	// console.log(req.originalUrl);
	// console.log(req.query);

	var cmdAry = req.body.cmdAry;
	// console.log(cmdAry);

	var stdout = '';
	var stderr = '';
	var _pathCurrentDir = process.cwd();
	var _pathGitDir = require('path').resolve(__dirname+'/../../data/');
	process.chdir( _pathGitDir );

	var proc = require('child_process').spawn('git', cmdAry);
	proc.stdout.on('data', function(data){
		stdout += data;
	});
	proc.stderr.on('data', function(data){
		stderr += data;
	});
	proc.on('close', function(code){
		res.send(JSON.stringify({
			code: code,
			stdout: stdout,
			stderr: stderr,
		}));
	});

	process.chdir( _pathCurrentDir );
	return;
} );

// ルートパスのハンドラ - GETパラメータに応じてテンプレートを処理
app.get('/', function(req, res, next){
	const appearance = req.query.appearance;
	let px2styleTheme = 'default.css';
	
	// GETパラメータに応じてCSSを切り替え
	if (appearance === 'darkmode') {
		px2styleTheme = 'darkmode.css';
	} else if (appearance === 'lightmode') {
		px2styleTheme = 'default.css';
	} else {
		px2styleTheme = 'auto.css';
	}
	
	// テンプレートを読み込んで変数を置換
	const templatePath = path.resolve(__dirname, '../client/index.html');
	fs.readFile(templatePath, 'utf8', function(err, data){
		if (err) {
			console.error('Template read error:', err);
			res.status(500).send('Internal Server Error');
			return;
		}
		
		const html = data.replace('{{PX2STYLE_THEME}}', px2styleTheme);
		res.send(html);
	});
});

app.use( express.static( __dirname+'/../client/' ) );

// 8080番ポートでLISTEN状態にする
server.listen( 8080, function(){
	console.log('server-standby');
} );
