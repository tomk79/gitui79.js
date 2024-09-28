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
					console.info('   --- result:', result, stderr);
					callback(result.code, result.stdout, result.stderr);
				}
			});
			return;
		},
		{
			committer: {
				name: 'Test User',
				email: 'test.user@example.com',
			},
			lang: "ja",
		}
	);
	// console.log(gitUi79);
	gitUi79.init(function(){
		console.log('ready.');
	});
})();
