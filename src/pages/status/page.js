/**
 * page: status
 */
module.exports = function(main, $elms, gitparse79){
	var _twig = require('twig');
	var templates = {
		"git_status": require('./templates/git_status.html'),
		"diff": require('./templates/diff.html')
	};

	// --------------------------------------
	// 差分を表示する
	function showDiff( file, status, isStaged ){
		var diffInfo;
		px2style.loading();

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				gitparse79.git(
					['diff', file],
					function(result){
						// console.log('=-=-=-=-=-=-=', result);
						diffInfo = result;
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				var src = _twig.twig({
					data: templates.diff
				}).render({
					file: file,
					status: status,
					isStaged: isStaged,
					code: diffInfo.stdout
				});
				var $body = $('<div>').addClass('gitui79').append(src);
				var $rollbackButton = $('<button>')
					.text('この変更を取り消す')
					.addClass('px2-btn')
					.attr('type', 'button')
					.on('click', function(){
						if( !confirm('変更を取り消し、元に戻します。よろしいですか？') ){
							return;
						}
						alert('[ERROR] 開発中の機能です。');
					})
				;

				px2style.modal(
					{
						title: '詳細',
						body: $body,
						buttons: [
							'<button type="submit" class="px2-btn px2-btn--primary">OK</button>'
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
						width: 700
					},
					function(){
						px2style.closeLoading();
					}
				);

			}); })
		;
		return;
	}





	return function(){
		$elms.body.innerHTML = '';
		var git_status;
		px2style.loading();

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				// --------------------------------------
				// 状態情報を取得
				gitparse79.git(
					['status', '-u'],
					function(result){
						// console.log(result);
						git_status = result;
						main.setCurrentBranchName(git_status.currentBranchName);
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// --------------------------------------
				// 状態情報を表示
				var src = _twig.twig({
					data: templates.git_status
				}).render({
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
				var btnOpenCommitForm = document.querySelector('.gitui79__btn-block-open-commit-form button');
				var blockCommitForm = document.querySelector('.gitui79__commit-form');
				var commitForm = document.querySelector('.gitui79__commit-form form');

				if( !btnOpenCommitForm ){
					// 変更がない場合はボタンが描画されない
					rlv();
					return;
				}

				btnOpenCommitForm.addEventListener('click', function(){
					blockOpenCommitForm.style.display = 'none';
					blockCommitForm.style.display = 'block';
				});
				commitForm.addEventListener('submit', function(){
					var message = this.querySelector('textarea').value;
					if(!message){
						alert('コミットメッセージを入力してください。');
						this.querySelector('textarea').focus();
						return;
					}
					commitForm.querySelectorAll('input, button, select, textarea').forEach(function(elm){
						elm.disabled = true;
					});
					px2style.loading();
					px2style.loadingMessage('コミットしています...');

					gitparse79.git(
						['add', './'],
						function(result){
							// console.log(result);
							gitparse79.git(
								[
									'commit',
									'-m', message,
									'--author='+main.getCommitter().name+' <'+main.getCommitter().email+'>'
								],
								function(result){
									console.log(result);
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
