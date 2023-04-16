/**
 * page: status
 */
module.exports = function(main, $elms, gitparse79){
	var _twig = require('twig');
	var templates = {
		"git_status": require('./templates/git_status.twig'),
		"diff": require('./templates/diff.twig'),
	};
	var it79 = require('iterate79');
	var px2style = main.px2style;

	// --------------------------------------
	// 画面を初期化
	function init(){
		$elms.body.innerHTML = '';
		var git_status;

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
				// --------------------------------------
				// 状態情報を取得
				gitparse79.git(
					['status', '-u'],
					function(result){
						git_status = result;
						main.setCurrentBranchName(git_status.currentBranchName);
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// --------------------------------------
				// 状態情報を表示
				var src = templates.git_status({
					status: git_status,
					currentBranchName: main.getCurrentBranchName(),
					committer: main.getCommitter()
				});

				$elms.body.innerHTML = src;

				rlv();
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// --------------------------------------
				// 差分表示

				$($elms.body).find('.gitui79__list-changes a').on('click', function(){
					var file = $(this).attr('data-file');
					var status = $(this).attr('data-status');
					var isStaged = $(this).attr('data-is-staged');
					showDiff(file, status, isStaged);
				});

				rlv();
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// --------------------------------------
				// コミットボタンの処理
				var blockOpenCommitForm = document.querySelector('.gitui79__btn-block-open-commit-form');
				var btnOpenCommitForm = document.querySelector('.gitui79__btn-block-open-commit-form button.gitui79__cont-btn-commit');
				var btnDiscardAll = document.querySelector('.gitui79__btn-block-open-commit-form button.gitui79__cont-btn-discard');
				var blockCommitForm = document.querySelector('.gitui79__commit-form');
				var commitForm = document.querySelector('.gitui79__commit-form form');

				if( !btnOpenCommitForm ){
					// 変更がない場合はボタンが描画されない
					rlv();
					return;
				}

				// コミットボタン
				btnOpenCommitForm.addEventListener('click', function(){
					blockOpenCommitForm.style.display = 'none';
					blockCommitForm.style.display = 'block';
				});
				commitForm.addEventListener('submit', function(){
					var messageInput = this.querySelector('textarea');
					var message = messageInput.value;
					if( !message ){
						alert('コミットメッセージを入力してください。');
						messageInput.focus();
						return;
					}

					var committerNameInput = this.querySelector('input[name="committer.name"]');
					var committerName = committerNameInput.value;
					if( !committerName ){
						alert('コミッターの名前を入力してください。');
						committerNameInput.focus();
						return;
					}

					var committerEmailInput = this.querySelector('input[name="committer.email"]');
					var committerEmail = committerEmailInput.value;
					if( !committerEmail ){
						alert('コミッターのメールアドレスを入力してください。');
						committerEmailInput.focus();
						return;
					}
					commitForm.querySelectorAll('input, button, select, textarea').forEach(function(elm){
						elm.disabled = true;
					});
					commitAll( message, {name: committerName, email: committerEmail} );
				});

				// 変更を破棄するボタン
				btnDiscardAll.addEventListener('click', function(){
					if( !confirm('すべての変更を破棄し、元に戻します。コミットされていない情報は永久に失われます。続けてよろしいですか？') ){
						return;
					}
					px2style.loading();
					discardAll( function(){
						px2style.closeLoading();
						alert('破棄しました。');
						main.pages.load('status');
					} );
				});
				rlv();
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				px2style.closeLoading();
				rlv();
			}); })
		;
	}

	// --------------------------------------
	// 差分を表示する
	function showDiff( file, status, isStaged ){
		var diffInfo;
		var diffHtml;
		px2style.loading();

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				var diffCmd = [];
				diffCmd.push('diff');
				diffCmd.push('-U12');
				if( isStaged == 'staged' ){
					diffCmd.push('--cached');
				}
				diffCmd.push(file);
				gitparse79.git(
					diffCmd,
					function(result){
						diffInfo = result;
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// --------------------------------------
				// diff2html
				const Diff2html = require('diff2html');
				diffHtml = Diff2html.html(
					Diff2html.parse( diffInfo.stdout ),
					{
						drawFileList: false,
						outputFormat: 'side-by-side',
					}
				);
				// / diff2html
				// --------------------------------------

				rlv();
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				var src = main.bindTwig(
					require('-!text-loader!./templates/diff.twig'),
					{
						file: file,
						status: status,
						isStaged: isStaged,
						code: diffInfo.stdout,
						diffHtml: diffHtml,
					}
				);
				var $body = $('<div>').addClass('gitui79').append(src);
				$body.find('.gitui79__resolve-ours').on('click', function(){
					alert('自分の変更を使って競合を解決します。');
					px2style.loading();
					resolveFile(file, 'ours', function(){
						px2style.closeLoading();
						px2style.closeModal();
						main.pages.load('status');
					});
				});
				$body.find('.gitui79__resolve-theirs').on('click', function(){
					alert('相手の変更を使って競合を解決します。');
					px2style.loading();
					resolveFile(file, 'theirs', function(){
						px2style.closeLoading();
						px2style.closeModal();
						main.pages.load('status');
					});
				});
				var $rollbackButton = $('<button>')
					.text('この変更を取り消す')
					.addClass('px2-btn')
					.attr('type', 'button')
					.on('click', function(){
						if( !confirm('変更を取り消し、元に戻します。よろしいですか？') ){
							callback();
							return;
						}
						px2style.loading();
						discardFile( file, status, isStaged, function(){
							px2style.closeLoading();
							px2style.closeModal();
							main.pages.load('status');
						} );
					})
				;

				px2style.modal(
					{
						title: '詳細',
						body: $body,
						width: '100%',
						buttons: [
							'<button type="submit" class="px2-btn px2-btn--primary">閉じる</button>'
						],
						buttonsSecondary: [
							$rollbackButton
						],
						form: {
							action: 'javascript:;',
							method: 'get',
							submit: function(){
								px2style.closeModal();
							}
						},
					},
					function(){
						px2style.closeLoading();
					}
				);

			}); })
		;
		return;
	}


	/**
	 * コミットする
	 */
	function commitAll( message, committer ){
		if( !message ){
			return false;
		}
		committer = committer || main.getCommitter();
		if( !committer.name || !committer.email ){
			return false;
		}

		px2style.loading();
		px2style.loadingMessage('コミットしています...');

		gitparse79.git(
			['add', '--all', './'],
			function(result){
				gitparse79.git(
					[
						'commit',
						'-m', message,
						'--author='+committer.name+' <'+committer.email+'>'
					],
					function(result){
						main.flashMessage('コミットしました。');
						px2style.loadingMessage('コミットしました。');
						setTimeout(function(){
							px2style.closeLoading();
							main.pages.load('status');
						}, 500);
					}
				);
			}
		);
	}


	/**
	 * 単ファイルの競合状態を解決する
	 */
	function resolveFile( file, direction, callback ){
		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				gitparse79.git(
					['checkout', '--'+direction, file],
					function(result){
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				gitparse79.git(
					['add', file],
					function(result){
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				callback();
			}); })
		;
	}



	/**
	 * 単ファイルの変更を破棄する
	 */
	function discardFile( file, status, isStaged, callback ){
		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				if( status != 'untracked' || isStaged != 'staged' ){
					rlv();
					return;
				}
				// ステージング済みの新規ファイルは、
				// 一旦 unstage する。
				gitparse79.git(
					['reset', 'HEAD', file],
					function(result){
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				if( status == 'untracked' ){
					gitparse79.git(
						['clean', '-f', file],
						function(result){
							rlv();
						}
					);
				}else{
					gitparse79.git(
						['checkout', 'HEAD', file],
						function(result){
							rlv();
						}
					);
				}
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				callback();
			}); })
		;
	}

	/**
	 * 変更を破棄する
	 */
	function discardAll( callback ){
		var git_status;

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				// 一旦ぜんぶを unstage する。
				gitparse79.git(
					['reset', 'HEAD', './'],
					function(result){

						// 戻せるものは全部戻す
						gitparse79.git(
							['checkout', 'HEAD', './'],
							function(result){
								rlv();
							}
						);
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				gitparse79.git(
					['status', '-u'],
					function(result){
						git_status = result;
						main.setCurrentBranchName(git_status.currentBranchName);
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				it79.ary(
					['staged', 'notStaged'],
					function( it1, isStaged, idx1 ){
						it79.ary(
							['deleted', 'modified', 'untracked'],
							function( it2, status, idx2 ){
								var files = git_status[isStaged][status];
								it79.ary(
									files,
									function( it3, file, idx3 ){
										px2style.loadingMessage( file );
										discardFile( file, status, isStaged, function(){
											it3.next();
										} );
									},
									function(){
										it2.next();
									}
								);
							},
							function(){
								it1.next();
							}
						);
					},
					function(){
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				it79.ary(
					['bothAdded', 'bothModified'],
					function( it2, status, idx2 ){
						var files = git_status.unmerged[status];
						it79.ary(
							files,
							function( it3, file, idx3 ){
								px2style.loadingMessage( file );
								discardFile( file, status, 'noStaged', function(){
									it3.next();
								} );
							},
							function(){
								it2.next();
							}
						);
					},
					function(){
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				callback();
			}); })
		;

	}



	return init;
}
