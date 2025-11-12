/**
 * server.js
 */
const fs = require('fs');
const path = require('path');
const utils79 = require('utils79');
const Twig = require('twig');
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

// Twigテンプレートの設定
const templateDir = path.resolve(__dirname, '../client/');
Twig.cache(false); // 開発時はキャッシュを無効化

// .htmlリクエストまたはディレクトリリクエストをTwigで処理
app.get('*', function(req, res, next){
	// リクエストパスから.twigファイルを解決
	let requestedFile = req.path.replace(/^\//, ''); // 先頭の/を削除
	
	// パスが空文字列または/で終わっている場合はindex.htmlを追加
	if (!requestedFile || requestedFile.endsWith('/')) {
		requestedFile += 'index.html';
	}
	
	// .htmlで終わっていない場合は次のハンドラへ
	if (!requestedFile.endsWith('.html')) {
		return next();
	}
	
	const twigPath = path.join(templateDir, requestedFile.replace('.html', '.twig'));
	
	// .twigファイルが存在するか確認
	if (!fs.existsSync(twigPath)) {
		// .twigファイルが存在しない場合は次のハンドラへ
		return next();
	}
	
	// GETパラメータをすべてテンプレートにバインド
	const templateData = Object.assign({}, req.query);
	
	// Twigテンプレートをレンダリング
	Twig.renderFile(twigPath, templateData, function(err, html){
		if (err) {
			console.error('Template render error:', err);
			res.status(500).send('Internal Server Error');
			return;
		}
		res.send(html);
	});
});

app.use( express.static( __dirname+'/../client/' ) );

// 8080番ポートでLISTEN状態にする
server.listen( 8080, function(){
	console.log('server-standby');
} );
