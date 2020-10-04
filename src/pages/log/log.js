/**
 * page: log
 */
module.exports = function(main, $elms, gitparse79){
	var _twig = require('twig');
	var templates = {
		"git_show": require('./templates/git_show.html'),
		"git_log": require('./templates/git_log.html'),
		"git_log_rows": require('./templates/git_log_rows.html'),
		"show_fileinfo": require('./templates/show_fileinfo.html')
	};


	// --------------------------------------
	// コミットの詳細を表示する
	function showCommitDetails( commit ){
		px2style.loading();
		gitparse79.git(
			['show', '--name-status', commit],
			function(result){
				console.log(result);
				var splitedCommitMessage = main.parseCommitMessage(result.message);
				var src = _twig.twig({
					data: templates.git_show
				}).render({
					commit: result,
					title: splitedCommitMessage.title,
					body: splitedCommitMessage.body
				});
				var $body = $('<div>').html(src);
				px2style.modal(
					{
						title: splitedCommitMessage.title,
						body: $body,
						buttons: [
							'<button type="submit" class="px2-btn px2-btn--primary">OK</button>'
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
								})
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
						console.log('done.');
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

		var src = _twig.twig({
			data: templates.show_fileinfo
		}).render({
			file: file,
			status: status
		});

		var $body = $('<div>').append(src);
		var modalTitle = file;
		modalTitle = modalTitle.replace(/^[\s\S]*?([^\/]*)$/, '$1');

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				px2style.modal(
					{
						title: modalTitle,
						body: $body,
						buttons: [
							'<button type="submit" class="px2-btn px2-btn--primary">OK</button>'
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
								})
						],
						form: {
							action: 'javascript:;',
							method: 'get',
							submit: function(){
								px2style.closeModal();
							}
						},
						width: 500
					},
					function(){
						px2style.closeLoading();
						console.log('done.');
					}
				);
			}); })
		;
	}


	// --------------------------------------
	// すべてのファイルをコミット時点の状態までロールバックする
	function rollbackAll(commit){
		px2style.loading();
		// console.log(commit);
		var diffFileList = [];

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				gitparse79.git(
					['diff', '--name-status', commit+'...HEAD'],
					function(result){
						console.log(result);
						// TODO: ここで得たファイルの一覧を `diffFileList` に記憶する
						// diffFileList = result.files;
						rlv();
						return;
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				console.log('TODO: 未実装; git diff から得たファイルの一覧を元に、1つずつ復元していく。');
				// diffFileList.forEach(function(){
				// 	gitparse79.git(
				// 		['checkout', commit, './'],
				// 		function(result){
				// 			// console.log(result);
				// 			return;
				// 		}
				// 	);
				// });
				rlv();
				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				px2style.closeLoading();
				console.log('done.');
				alert('バージョンを戻しました。');
				rlv();
			}); })
		;

	}

	// --------------------------------------
	// 指定のファイルをコミット時点の状態までロールバックする
	function rollbackFile(commit, file, status){
		px2style.loading();
		console.log(commit, file, status);

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				// rollback
				if( status == 'deleted' ){
					gitparse79.git(
						['rm', file],
						function(result){
							// console.log(result);
							rlv();
							return;
						}
					);
					return;
				}else{
					gitparse79.git(
						['checkout', commit, file],
						function(result){
							// console.log(result);
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
						// console.log(result);
						rlv();
						return;
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				px2style.closeLoading();
				console.log('done.');
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
			git_log.logs.forEach(function(log){
				var parsedCommitMessage = main.parseCommitMessage(log.message);
				log.messageTitle = parsedCommitMessage.title;
				log.messageBody = parsedCommitMessage.body;
			});
			var src_rows = _twig.twig({
				data: templates.git_log_rows
			}).render({
				log: git_log
			});
			$elms.body.querySelector('.gitui79__list-commit-logs').innerHTML += src_rows;
			$elms.body.querySelectorAll('.gitui79__list-commit-logs a').forEach(function(elm){
				elm.addEventListener('click', function(){
					var commit = this.getAttribute('data-commit');
					showCommitDetails(commit);
				});
			});
		}

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				gitparse79.git(
					['log', '--name-status', '--max-count='+(dpp), '--skip='+(dpp*currentPage)],
					function(result){
						console.log(result);
						git_log = result;
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				var src = _twig.twig({
					data: templates.git_log
				}).render({
					currentBranchName: main.getCurrentBranchName(),
					log: git_log,
					committer: main.getCommitter(),
					dpp: dpp
				});
				$elms.body.innerHTML = src;

				appendLogList(git_log);

				if( !git_log.logs.length || git_log.logs.length < dpp ){
					document.querySelector('.gitui79__btn-block-next-page').style.display = 'none';
				}

				rlv();
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				var $btnNext = document.querySelector('.gitui79__btn-block-next-page button');
				$btnNext.addEventListener('click', function(){
					px2style.loading();
					var main = this;
					main.disabled = true;
					currentPage ++;
					gitparse79.git(
						['log', '--max-count='+(dpp), '--skip='+(dpp*currentPage)],
						function(result){
							console.log(result);
							git_log = result;

							appendLogList(git_log);

							if( !git_log.logs.length || git_log.logs.length < dpp ){
								document.querySelector('.gitui79__btn-block-next-page').style.display = 'none';
							}
							main.disabled = false;

							px2style.closeLoading();
							rlv();
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
