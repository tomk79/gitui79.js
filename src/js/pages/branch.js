/**
 * page: branch
 */
module.exports = function(main, $elms, templates, gitparse79){
	var _twig = require('twig');

	return function(){

		$elms.body.innerHTML = '';
		var git_branch;
		var checkoutedRemoteBranches = {};

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				gitparse79.git(
					['branch', '-a'],
					function(result){
						console.log(result);
						git_branch = result;
						for(var i = 0; i < git_branch.remoteBranches.length; i ++){
							for(var ii = 0; ii < git_branch.localBranches.length; ii ++){
								var lastIndexOf = git_branch.remoteBranches[i].lastIndexOf('/'+git_branch.localBranches[ii]);
								if( lastIndexOf >= 0 && lastIndexOf + git_branch.localBranches[ii].length + 1 === git_branch.remoteBranches[i].length ){
									checkoutedRemoteBranches[git_branch.remoteBranches[i]] = true;
								}
							}
						}
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				var src = _twig.twig({
					data: templates.git_branch
				}).render({
					currentBranchName: main.getCurrentBranchName(),
					branch: git_branch,
					checkoutedRemoteBranches: checkoutedRemoteBranches
				});
				$elms.body.innerHTML = src;

				rlv();
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				$elms.body.querySelectorAll('a[data-branch-name]').forEach(function(elm){
					elm.addEventListener('click', function(){
						var branchName = this.getAttribute('data-branch-name');

						if( branchName.match(/^remotes\//) ){
							// --------------------
							// リモートブランチをチェックアウトする

							var remoteBranchName = branchName.replace(/^remotes\//, '');
							var localBranchName = branchName.replace(/^remotes\/[^\/]*?\//, '');
							gitparse79.git(
								['checkout', '-b', localBranchName, remoteBranchName],
								function(result){
									console.log(result);
									if( result.result ){
										main.setCurrentBranchName(result.currentBranchName);
										main.pages.load('branch');
									}else{
										alert('Failed.');
									}
								}
							);
						}else{
							// --------------------
							// ローカルブランチをチェックアウトする

							gitparse79.git(
								['checkout', branchName],
								function(result){
									console.log(result);
									if( result.result ){
										main.setCurrentBranchName(result.currentBranchName);
										main.pages.load('branch');
									}else{
										alert('Failed.');
									}
								}
							);
						}
					});
				});

				$elms.body.querySelectorAll('button[data-branch-name]').forEach(function(elm){
					elm.addEventListener('click', function(){
						var branchName = this.getAttribute('data-branch-name');
						var method =  this.getAttribute('data-method');

						if( method == 'merge' ){
							// --------------------
							// ブランチをマージする
							if( !confirm('ブランチ '+branchName+' を、 ' + main.getCurrentBranchName() + ' にマージしようとしています。' + "\n" + 'よろしいですか？') ){
								return;
							}
							gitparse79.git(
								['merge', branchName],
								function(result){
									console.log(result);
									if(result.code){
										alert(result.stdout);
									}else{
										alert('Success!');
									}
									main.pages.load('branch');
								}
							);
						}else if( method == 'delete' ){
							// --------------------
							// ブランチを削除する
							if( !confirm('ブランチ '+branchName+' を、削除してもよろしいですか？') ){
								return;
							}
							if( branchName.match(/^remotes\//) ){
								// リモートブランチを削除する

								var remoteName = branchName.replace(/^remotes\/([^\/]*?)\/[\s\S]*$/, '$1');
								var localBranchName = branchName.replace(/^remotes\/[^\/]*?\//, '');
								// alert(remoteName);
								// alert(localBranchName);
								gitparse79.git(
									['push', '--delete', remoteName, localBranchName],
									function(result){
										console.log(result);
										if(result.code){
											alert(result.stdout);
										}
										main.pages.load('branch');
									}
								);
							}else{
								// ローカルブランチを削除する

								gitparse79.git(
									['branch', '--delete', branchName],
									function(result){
										console.log(result);
										if(result.code){
											alert(result.stdout);
										}
										main.pages.load('branch');
									}
								);
							}
						}
					});
				});

				$elms.body.querySelector('form').addEventListener('submit', function(elm){
					var newBranchName = this.querySelector('input[name=branch-name]').value;
					if( newBranchName.match(/^remotes/i) ){
						alert('remotes で始まる名前は使えません。');
						return;
					}
					if( newBranchName.match(/(?:\s|　)/i) ){
						alert('ブランチ名にスペースや空白文字を含めることはできません。');
						return;
					}
					// alert(newBranchName);
					gitparse79.git(
						['checkout', '-b', newBranchName],
						function(result){
							console.log(result);
							if( result.result ){
								main.setCurrentBranchName(result.currentBranchName);
								main.pages.load('branch');
							}else{
								alert('Failed.');
							}
						}
					);
				});
			}); })
		;
	}
}
