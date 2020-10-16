/**
 * page: branch
 */
module.exports = function(main, $elms, gitparse79){
	var _twig = require('twig');
	var templates = {
		"git_branch": require('./templates/git_branch.html')
	};
	var px2style = main.px2style;

	return function(){

		$elms.body.innerHTML = '';
		var git_branch;
		var checkoutedRemoteBranches = {};

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				px2style.loading();
				rlv();
			}); })
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

							px2style.loading();
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
									px2style.closeLoading();
								}
							);
							return;
						}else{
							// --------------------
							// ローカルブランチをチェックアウトする

							px2style.loading();
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
									px2style.closeLoading();
								}
							);
							return;
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
							px2style.loading();
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
									px2style.closeLoading();
								}
							);
							return;
						}else if( method == 'delete' ){
							// --------------------
							// ブランチを削除する
							if( !confirm('ブランチ '+branchName+' を、削除してもよろしいですか？') ){
								return;
							}
							px2style.loading();
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
										px2style.closeLoading();
									}
								);
								return;
							}else{
								// ローカルブランチを削除する

								px2style.loading();
								gitparse79.git(
									['branch', '--delete', branchName],
									function(result){
										console.log(result);
										if(result.code){
											if( confirm(result.stdout+"\n\n"+'強制的に削除しますか？') ){
												gitparse79.git(
													['branch', '-f', '--delete', branchName],
													function(result){
														console.log(result);
														if(result.code){
															alert(result.code);
														}
														main.pages.load('branch');
														px2style.closeLoading();
													}
												);
												return;
											}
										}
										main.pages.load('branch');
										px2style.closeLoading();
										return;
									}
								);
							}
							return;
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

					px2style.loading();

					gitparse79.git(
						['checkout', '-b', newBranchName],
						function(result){
							// console.log(result);
							if( result.result ){
								main.setCurrentBranchName(result.currentBranchName);
								main.pages.load('branch');
							}else{
								alert('Failed.');
							}
							px2style.closeLoading();
						}
					);
					return;
				});

				rlv();
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// Standby OK.
				px2style.closeLoading();
				rlv();
			}); })
		;
	}
}
