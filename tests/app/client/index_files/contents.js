(function(){
	var gitUi79 = window.gitUi79 = new GitUi79(
		document.getElementById('cont-gitui79'),
		function(cmdAry, callback){
			// サーバーでgitコマンドを実行するAPIを用意してください。
			// callback には、 gitコマンドが出力した文字列を返してください。
			var stdout = '';
			$.ajax({
				url: '/apis/git',
				method: 'POST',
				data: {"cmdAry": cmdAry},
				success: function(data){
					stdout += data;
				},
				error: function(data){
					stdout += data; // エラー出力も stdout に混ぜて送る
				},
				complete: function(){
					// alert(stdout);
					var result = JSON.parse(stdout);
					callback(result.code, result.stdout);
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
