/**
 * page: log
 */
module.exports = function(main, $elms, gitparse79){
	var it79 = require('iterate79');
	var px2style = main.px2style;


	// --------------------------------------
	// コミットの詳細を表示する
	function showCommitDetails( commit ){
		px2style.loading();

		gitparse79.git(
			['show', '--name-status', commit],
			function(result){
				var splitedCommitMessage = main.parseCommitMessage(result.message);
				var src = main.bindTwig( require('-!text-loader!./templates/git_show.twig'), {
					commit: result,
					title: splitedCommitMessage.title,
					body: splitedCommitMessage.body,
				} );
				var $body = $('<div>').html(src);
				px2style.modal(
					{
						title: splitedCommitMessage.title,
						body: $body,
						buttons: [
							'<button type="submit" class="px2-btn px2-btn--primary">閉じる</button>'
						],
						buttonsSecondary: [
							$('<button>')
								.text('このバージョンに戻す')
								.addClass('px2-btn')
								.attr('type', 'button')
								.on('click', function(){
									if( !confirm('すべてのファイルのバージョンを戻します。コミットされていない変更がある場合は、破棄されます。続けますか？') ){
										return;
									}
									rollbackAll(commit);
								}),
							$('<button>')
								.text('このバージョン適用前に戻す')
								.addClass('px2-btn')
								.attr('type', 'button')
								.on('click', function(){
									if( !confirm('すべてのファイルのバージョンを戻します。コミットされていない変更がある場合は、破棄されます。続けますか？') ){
										return;
									}
									rollbackAll(commit+'~');
								}),
						],
						form: {
							action: 'javascript:;',
							method: 'get',
							submit: function(){
								px2style.closeModal();
							}
						},
						width: 700
					},
					function(){
						px2style.closeLoading();
					}
				);
				$body.find('.gitui79__list-changes a')
					.on('click', function(){
						var file = $(this).attr('data-file');
						var status = $(this).attr('data-status');
						showCommitFile(commit, file, status);
					})
				;
			}
		);
	}

	// --------------------------------------
	// コミットに含まれるファイルの情報を表示する
	function showCommitFile(commit, file, status){
		px2style.loading();

		var $body;
		var modalTitle = file;
		modalTitle = modalTitle.replace(/^[\s\S]*?([^\/]*)$/, '$1');

		var diffHtmlLineByLine = '';
		var diffHtmlSideBySide = '';

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				gitparse79.git(
					['diff', commit+'~', commit, '--', file],
					function(result){
						if( !result.errors.length ){
							// --------------------------------------
							// diff2html
							const Diff2html = require('diff2html');
							diffHtmlLineByLine = Diff2html.html(
								Diff2html.parse( result.stdout ),
								{
									drawFileList: false,
									outputFormat: 'line-by-line',
									colorScheme: 'auto',
								}
							);
							diffHtmlSideBySide = Diff2html.html(
								Diff2html.parse( result.stdout ),
								{
									drawFileList: false,
									outputFormat: 'side-by-side',
									colorScheme: 'auto',
								}
							);
							// / diff2html
							// --------------------------------------
						}

						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				var src = main.bindTwig( require('-!text-loader!./templates/show_fileinfo.twig'), {
					file: file,
					status: status,
					diffHtmlLineByLine,
					diffHtmlSideBySide,
				} );

				$body = $('<div>').addClass('gitui79').append(src);
				rlv();
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){

				px2style.modal(
					{
						title: modalTitle,
						body: $body,
						width: '100%',
						buttons: [
							'<button type="submit" class="px2-btn px2-btn--primary">閉じる</button>'
						],
						buttonsSecondary: [
							$('<button>')
								.text('このバージョンに戻す')
								.addClass('px2-btn')
								.attr('type', 'button')
								.on('click', function(){
									if( !confirm('選択したファイルのバージョンを戻します。コミットされていない変更がある場合は、破棄されます。続けますか？') ){
										return;
									}
									rollbackFile(commit, file, status);
								}),
							$('<button>')
								.text('このバージョン適用前に戻す')
								.addClass('px2-btn')
								.attr('type', 'button')
								.on('click', function(){
									if( !confirm('選択したファイルのバージョンを戻します。コミットされていない変更がある場合は、破棄されます。続けますか？') ){
										return;
									}
									rollbackFile(commit+'~', file, status);
								}),
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
	}


	// --------------------------------------
	// すべてのファイルをコミット時点の状態までロールバックする
	function rollbackAll(commit){
		px2style.loading();
		var diffFileList = [];

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				gitparse79.git(
					['checkout', commit, './'],
					function(result){
						rlv();
						return;
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				gitparse79.git(
					['diff', '--name-status', commit],
					function(result){
						diffFileList = result.diff;
						rlv();
						return;
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				it79.ary(
					diffFileList,
					function(itAry1, diffRow, diffIdx){
						px2style.loadingMessage( diffRow.filename );
						if( diffRow.type == 'added' ){
							gitparse79.git(
								['rm', diffRow.filename],
								function(result){
									itAry1.next();
									return;
								}
							);
							return;
						}else{
							gitparse79.git(
								['checkout', commit, diffRow.filename],
								function(result){
									itAry1.next();
									return;
								}
							);
						}
					},
					function(){
						rlv();
					}
				);
				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// unstage
				px2style.loadingMessage( 'Unstaging...' );
				gitparse79.git(
					['reset', 'HEAD', './'],
					function(result){
						rlv();
						return;
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				px2style.closeLoading();
				alert('バージョンを戻しました。');
				rlv();
			}); })
		;

	}

	// --------------------------------------
	// 指定のファイルをコミット時点の状態までロールバックする
	function rollbackFile(commit, file, status){
		px2style.loading();

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				// rollback
				if( status == 'deleted' ){
					gitparse79.git(
						['rm', file],
						function(result){
							rlv();
							return;
						}
					);
					return;
				}else{
					gitparse79.git(
						['checkout', commit, file],
						function(result){
							rlv();
							return;
						}
					);
				}
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// unstage
				gitparse79.git(
					['reset', 'HEAD', file],
					function(result){
						rlv();
						return;
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				px2style.closeLoading();
				alert('ファイル '+file+' のバージョンを戻しました。');
				rlv();
			}); })
		;

	}


	return function(){
		$elms.body.innerHTML = '';
		var git_log;
		var dpp = 50;
		var currentPage = 0;
		px2style.loading();

		function appendLogList(git_log){
			if( !git_log || !git_log.logs || !git_log.logs.length ){
				return;
			}
			git_log.logs.forEach(function(log){
				var parsedCommitMessage = main.parseCommitMessage(log.message);
				log.messageTitle = parsedCommitMessage.title;
				log.messageBody = parsedCommitMessage.body;
			});
			var src_rows = main.bindTwig( require('-!text-loader!./templates/git_log_rows.twig'), {
				log: git_log
			} );

			$elms.body.querySelector('.gitui79__cont-list-commit-logs').innerHTML += src_rows;
			$elms.body.querySelectorAll('.gitui79__cont-list-commit-logs a').forEach(function(elm){
				elm.addEventListener('click', function(){
					var commit = this.getAttribute('data-commit');
					showCommitDetails(commit);
				});
			});
		}

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				gitparse79.git(
					['log', '--max-count='+(dpp), '--skip='+(dpp*currentPage)],
					function(result){
						git_log = result;
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				var src = main.bindTwig( require('-!text-loader!./templates/git_log.twig'), {
					currentBranchName: main.getCurrentBranchName(),
					log: git_log,
					committer: main.getCommitter(),
					dpp: dpp
				} );
				$elms.body.innerHTML = src;

				appendLogList(git_log);

				rlv();
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				if( !git_log || !git_log.logs || !git_log.logs.length || git_log.logs.length < dpp ){
					rlv();
				}

				var $btnNext = document.querySelector('.gitui79__btn-block-next-page button');
				$btnNext.addEventListener('click', function(){
					px2style.loading();
					var main = this;
					main.disabled = true;
					currentPage ++;
					gitparse79.git(
						['log', '--max-count='+(dpp), '--skip='+(dpp*currentPage)],
						function(result){
							git_log = result;

							appendLogList(git_log);

							if( !git_log.logs.length || git_log.logs.length < dpp ){
								document.querySelector('.gitui79__btn-block-next-page').style.display = 'none';
							}
							main.disabled = false;

							px2style.closeLoading();
						}
					);
				});

				rlv();
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				px2style.closeLoading();
				rlv();
			}); })
		;
	}
}
