/**
 * page: status
 */
module.exports = function(main, $elms, gitparse79){
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
				var src = main.bindTwig( require('-!text-loader!./templates/git_status.twig'), {
					status: git_status,
					currentBranchName: main.getCurrentBranchName(),
					committer: main.getCommitter()
				} );

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
				var blockCommitForm = document.querySelector('.gitui79__cont-commit-form');
				var commitForm = document.querySelector('.gitui79__cont-commit-form form');

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
						alert(main.lb.get('status.enter_commit_message'));
						messageInput.focus();
						return;
					}

					var committerNameInput = this.querySelector('input[name="committer.name"]');
					var committerName = committerNameInput.value;
					if( !committerName ){
						alert(main.lb.get('status.enter_committer_name'));
						committerNameInput.focus();
						return;
					}

					var committerEmailInput = this.querySelector('input[name="committer.email"]');
					var committerEmail = committerEmailInput.value;
					if( !committerEmail ){
						alert(main.lb.get('status.enter_committer_email'));
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
					if( !confirm(main.lb.get('status.confirm_discard_all')) ){
						return;
					}
					px2style.loading();
					discardAll( function(){
						px2style.closeLoading();
						alert(main.lb.get('status.discarded'));
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
		var diffText = '';
		var diffHtmlLineByLine = '';
		var diffHtmlSideBySide = '';
		var isNewFile = false;
		px2style.loading();

		// 新規ファイルかどうかを判定
		// `untracked` の場合は新規ファイル
		if( status === 'untracked'){
			isNewFile = true;
		}

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				if( isNewFile ){
					// 新規ファイルの場合は、ファイル内容を取得
					if( isStaged == 'staged' ){
						// ステージングされた新規ファイルの内容を取得
						// git show :0:filename でインデックスのファイル内容を取得
						gitparse79.git(
							['show', ':0:' + file],
							function(result){
								diffInfo = result;
								rlv();
							}
						);
					} else {
						// ステージングされていない新規ファイル（untrackedファイル）の場合
						// git diff --no-index /dev/null <file> で差分を取得
						// これにより、空ファイルと現在のファイルの差分が取得できる
						gitparse79.git(
							['diff', '--no-index', '-U12', '/dev/null', file],
							function(result){
								// exit code 1 は差分がある場合の正常終了
								if( result.code === 1 || result.code === 0 ){
									diffInfo = {
										code: 0,
										stdout: result.stdout,
										stderr: result.stderr,
										errors: []
									};
								} else {
									diffInfo = result;
								}
								rlv();
							}
						);
					}
				} else {
					// 既存ファイルの差分を取得
					var diffCmd = [];
					diffCmd.push('diff');
					diffCmd.push('-U12');
					if( isStaged == 'staged' ){
						diffCmd.push('--cached');
					}
					diffCmd.push('--');
					diffCmd.push(file);
					gitparse79.git(
						diffCmd,
						function(result){
							diffInfo = result;
							rlv();
						}
					);
				}
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// --------------------------------------
				// diff2html
				if( isNewFile && isStaged == 'staged' ){
					// ステージ済み新規ファイルの場合、unified diff形式を手動で作成
					var fileContent = diffInfo.stdout || '';
					var lines = fileContent.split('\n');
					
					// 末尾の空行を除外（splitの結果、最後が空文字列になる場合がある）
					if( lines.length > 0 && lines[lines.length - 1] === '' ){
						lines.pop();
					}
					
					// unified diff形式のヘッダーを作成
					diffText = 'diff --git a/' + file + ' b/' + file + '\n';
					diffText += 'new file mode 100644\n';
					diffText += 'index 0000000..0000000\n';
					diffText += '--- /dev/null\n';
					diffText += '+++ b/' + file + '\n';
					diffText += '@@ -0,0 +1,' + lines.length + ' @@\n';
					
					// 各行に + プレフィックスを追加
					for( var i = 0; i < lines.length; i++ ){
						diffText += '+' + lines[i];
						if( i < lines.length - 1 ){
							diffText += '\n';
						}
					}
					// 最後に改行を追加（unified diff形式の規則）
					if( lines.length > 0 ){
						diffText += '\n';
					}
				} else if( isNewFile && isStaged != 'staged' ){
					// untracked ファイルの場合、git diff --no-index の出力をそのまま使用
					// ただし、パス表記を調整する必要がある場合がある
					diffText = diffInfo.stdout;
					
					// /dev/null の表記を a/ に、実際のファイルパスを b/ に統一
					// git diff --no-index の出力形式を normalized する
					if( diffText ){
						// 既に unified diff 形式なのでそのまま使用
						// 必要に応じてパス正規化
						diffText = diffText.replace(/^--- \/dev\/null/gm, '--- /dev/null');
						diffText = diffText.replace(/^\+\+\+ b\//gm, '+++ b/');
					}
				} else {
					diffText = diffInfo.stdout;
				}

				if( !diffInfo.errors || !diffInfo.errors.length ){
					const Diff2html = require('diff2html/lib/src/diff2html');
					diffHtmlLineByLine = Diff2html.html(
						Diff2html.parse( diffText ),
						{
							drawFileList: false,
							outputFormat: 'line-by-line',
							colorScheme: 'auto',
						}
					);
					diffHtmlSideBySide = Diff2html.html(
						Diff2html.parse( diffText ),
						{
							drawFileList: false,
							outputFormat: 'side-by-side',
							colorScheme: 'auto',
						}
					);
				}
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
						code: diffText,
						diffHtmlLineByLine,
						diffHtmlSideBySide,
					}
				);
				var $body = $('<div>').addClass('gitui79').append(src);
				$body.find('.gitui79__resolve-ours').on('click', function(){
					alert(main.lb.get('status.resolve_ours_confirm'));
					px2style.loading();
					resolveFile(file, 'ours', function(){
						px2style.closeLoading();
						px2style.closeModal();
						main.pages.load('status');
					});
				});
				$body.find('.gitui79__resolve-theirs').on('click', function(){
					alert(main.lb.get('status.resolve_theirs_confirm'));
					px2style.loading();
					resolveFile(file, 'theirs', function(){
						px2style.closeLoading();
						px2style.closeModal();
						main.pages.load('status');
					});
				});
				var $rollbackButton = $('<button>')
					.text(main.lb.get('status.cancel_changes'))
					.addClass('px2-btn')
					.attr('type', 'button')
					.on('click', function(){
						if( !confirm(main.lb.get('status.confirm_cancel_change')) ){
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
						title: main.lb.get('status.detail'),
						body: $body,
						width: '100%',
						buttons: [
							'<button type="submit" class="px2-btn px2-btn--primary">'+main.lb.get('ui_label.close')+'</button>'
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

		let isSuccess = true;

		it79.fnc({}, [
			function(it){
				gitparse79.git(
					['add', '--all', './'],
					function(result){
						if( result.code ){
							isSuccess = false;
							alert('Error: status: status code: '+result.code+';'+"\n"+result.stdout);
						}
						it.next();
					}
				);
			},
			function(it){
				gitparse79.git(
					[
						'commit',
						'-m', message,
						'--author="'+main.escapeShell(committer.name)+' <'+main.escapeShell(committer.email)+'>"'
					],
					function(result){
						if( result.code ){
							isSuccess = false;
							alert('Error: status: status code: '+result.code+';'+"\n"+result.stdout);
						}
						it.next();
					}
				);
			},
			function(it){
				if( !isSuccess ){
					main.flashMessage('コミットに失敗しました。');
					px2style.loadingMessage('コミットに失敗しました。');
				}else{
					main.flashMessage('コミットしました。');
					px2style.loadingMessage('コミットしました。');
				}
				setTimeout(function(){
					px2style.closeLoading();
					main.pages.load('status');
				}, 500);
			},
		]);
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
