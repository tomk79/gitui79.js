(function(){
	var gitUi79 = window.gitUi79 = new GitUi79(
		document.getElementById('cont-gitui79'),
		function(cmdAry, callback){
			// サーバーでgitコマンドを実行するAPIを用意してください。
			// callback には、 gitコマンドが出力した文字列を返してください。
			console.info('=-=-=-= cmdAry:', cmdAry);
			var stdout = null;
			var stderr = null;
			$.ajax({
				url: '/apis/git',
				method: 'POST',
				data: {"cmdAry": cmdAry},
				success: function(data){
					stdout = data;
				},
				error: function(data){
					stderr = data;
				},
				complete: function(){
					var result = JSON.parse(stdout);
					
					// Base64エンコードされたデータをデコード
					var decodedStdout = result.stdout;
					var decodedStderr = result.stderr;
					
					if (result.encoding === 'base64') {
						try {
							// Base64デコードしてUint8Arrayに変換
							var binaryStdout = atob(result.stdout);
							var binaryStderr = atob(result.stderr);
							
							// バイナリ文字列をUint8Arrayに変換
							var uint8ArrayStdout = new Uint8Array(binaryStdout.length);
							var uint8ArrayStderr = new Uint8Array(binaryStderr.length);
							
							for (var i = 0; i < binaryStdout.length; i++) {
								uint8ArrayStdout[i] = binaryStdout.charCodeAt(i);
							}
							for (var i = 0; i < binaryStderr.length; i++) {
								uint8ArrayStderr[i] = binaryStderr.charCodeAt(i);
							}
							
							// UTF-8としてデコードを試みる（fatal: trueで失敗時にエラーを投げる）
							try {
								var decoder = new TextDecoder('utf-8', { fatal: true });
								decodedStdout = decoder.decode(uint8ArrayStdout);
								decodedStderr = decoder.decode(uint8ArrayStderr);
							} catch(utf8Error) {
								// UTF-8デコードに失敗した場合、バイナリデータとして扱う（Latin-1）
								decodedStdout = binaryStdout;
								decodedStderr = binaryStderr;
							}
						} catch(e) {
							console.error('Base64 decode error:', e);
						}
					}
					
					console.info('   --- result:', result, stderr);
					callback(result.code, decodedStdout, decodedStderr);
				}
			});
			return;
		},
		{
			committer: {
				name: 'Test User',
				email: 'test.user@example.com',
			},
			lang: window.lang || "en",
		}
	);
	// console.log(gitUi79);
	gitUi79.init(function(){
		console.log('ready.');
	});
})();
