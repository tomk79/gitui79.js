/**
 * page: branch
 */
module.exports = function(main, $elms, gitparse79){
	var _twig = require('twig');
	var templates = {
		"git_branch": require('./templates/git_branch.twig')
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
					['fetch', '--prune'],
					function(result){
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				gitparse79.git(
					['branch', '-a'],
					function(result){
						git_branch = result;
						// カレントブランチ名を更新
						main.setCurrentBranchName(result.currentBranchName);
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
				var src = templates.git_branch({
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
									if( result.code === 0 ){
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
									if( result.code === 0 ){
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
							if( !confirm(main.lb.get('branch.confirm_merge').replace('{branchName}', branchName).replace('{currentBranch}', main.getCurrentBranchName())) ){
								return;
							}
							px2style.loading();
							gitparse79.git(
								['merge', branchName],
								function(result){
									if(result.code){
										alert(result.stdout);
									}else{
										alert(main.lb.get('branch.success'));
									}
									main.pages.load('branch');
									px2style.closeLoading();
								}
							);
							return;
						}else if( method == 'delete' ){
							// --------------------
							// ブランチを削除する
							if( !confirm(main.lb.get('branch.confirm_delete').replace('{branchName}', branchName)) ){
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
										if(result.code){
											if( confirm(result.stdout+"\n\n"+main.lb.get('branch.force_delete_confirm')) ){
												gitparse79.git(
													['branch', '-f', '--delete', branchName],
													function(result){
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

				// 新しいブランチ作成ボタン
				var btnCreateBranch = $elms.body.querySelector('#gitui79-btn-create-branch');
				if (btnCreateBranch) {
					btnCreateBranch.addEventListener('click', function(){
						// モーダルでブランチ名入力フォームを表示
						var $modalBody = $('<div>').addClass('px2-p');
						var $input = $('<input>')
							.attr('type', 'text')
							.attr('name', 'branch-name')
							.attr('placeholder', main.lb.get('branch.enter_branch_name'))
							.addClass('px2-input')
							.css('width', '100%');
						$modalBody.append($input);

						px2style.modal(
							{
								title: main.lb.get('branch.create_new_branch'),
								body: $modalBody,
								buttons: [
									'<button type="submit" class="px2-btn px2-btn--primary">'+main.lb.get('ui_label.create')+'</button>'
								],
								buttonsSecondary: [
									$('<button type="button" class="px2-btn">'+main.lb.get('ui_label.cancel')+'</button>')
										.on('click', function(){
											px2style.closeModal();
										})
								],
								form: {
									action: 'javascript:;',
									method: 'post',
									submit: function(){
										var newBranchName = $input.val().trim();
										
										if( !newBranchName ){
											alert(main.lb.get('branch.enter_branch_name'));
											return false;
										}
										if( newBranchName.match(/^remotes/i) ){
											alert(main.lb.get('branch.cannot_use_remotes'));
											return false;
										}
										if( newBranchName.match(/(?:\s|　)/i) ){
											alert(main.lb.get('branch.no_spaces'));
											return false;
										}

										px2style.closeModal();
										px2style.loading();

										gitparse79.git(
											['checkout', '-b', newBranchName],
											function(result){
												if( result.code === 0 ){
													main.setCurrentBranchName(result.currentBranchName);
													main.pages.load('branch');
												}else{
													alert(main.lb.get('branch.failed'));
												}
												px2style.closeLoading();
											}
										);
										return false;
									}
								},
								width: 500
							},
							function(){
								// モーダルが開いたらinputにフォーカス
								$input.focus();
							}
						);
					});
				}

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
