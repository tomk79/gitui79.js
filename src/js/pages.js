/**
 * pages
 */
module.exports = function(main, gitparse79, $elms, templates){
    var _this = this;
	var _twig = require('twig');
	this.pages = {};


	/**
	 * ページを開く
	 */
	this.load = function(pageName){
		$elms.elm.querySelectorAll('.gitui79__toolbar a').forEach(function(elm){
			elm.classList.remove('active');
		});
		$elms.elm.querySelector('.gitui79__btn--'+pageName).classList.add('active');
		this.pages[pageName]();
	}

	/**
	 * page: status
	 */
	this.pages.status = function(){
		$elms.body.innerHTML = '';
		var git_status;
		px2style.loading();

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				gitparse79.git(
					['status', '-uall'],
					function(result){
						console.log(result);
						git_status = result;
						main.setCurrentBranchName(git_status.currentBranchName);
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
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
							console.log(result);
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
										_this.pages.status();
									}, 3000);
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


	/**
	 * page: branch
	 */
	this.pages.branch = require('./pages/branch.js')(main, $elms, templates, gitparse79);

	/**
	 * page: log
	 */
	this.pages.log = function(){
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
					px2style.loading();
					gitparse79.git(
						['show', this.getAttribute('data-commit')],
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
							px2style.modal(
								{
									title: splitedCommitMessage.title,
									body: src,
									buttons: [
										'<button type="submit" class="px2-btn px2-btn--primary">OK</button>'
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
						}
					);

				});
			});
		}

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				gitparse79.git(
					['log', '--max-count='+(dpp), '--skip='+(dpp*currentPage)],
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

	/**
	 * page: pull
	 */
	this.pages.pull = function(){
		$elms.body.innerHTML = '';
		var git_remote;
		px2style.loading();

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				gitparse79.git(
					['remote', '-v'],
					function(result){
						console.log(result);
						git_remote = result;
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				var src = _twig.twig({
					data: templates.git_pull
				}).render({
					currentBranchName: main.getCurrentBranchName(),
					remote: git_remote
				});
				$elms.body.innerHTML = src;

				if( !git_remote.remotes.length ){
					$elms.body.querySelectorAll('button').forEach(function(elm){
						elm.disabled = true;
					});
				}
				rlv();
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				$elms.body.querySelector('button').addEventListener('click', function(){
					px2style.loading();
					var formElements = $elms.body.querySelectorAll('button');
					formElements.forEach(function(elm){
						elm.disabled = true;
					});

					var remoteName = $elms.body.querySelector('input[type=radio][name=remote_name]:checked').value;
					if( !remoteName ){
						alert('Select remote.');
						formElements.forEach(function(elm){
							elm.disabled = false;
						});
						px2style.closeLoading();
						return;
					}

					gitparse79.git(
						['pull', remoteName, main.getCurrentBranchName()+':'+main.getCurrentBranchName()],
						function(result){
							console.log(result);
							// alert('refresh');
							$elms.body.querySelector('.gitui79__result-stdout code').innerHTML = result.stdout;
							formElements.forEach(function(elm){
								elm.disabled = false;
							});
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

	/**
	 * page: push
	 */
	this.pages.push = function(){
		$elms.body.innerHTML = '';
		var git_remote;
		px2style.loading();

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				gitparse79.git(
					['remote', '-v'],
					function(result){
						console.log(result);
						git_remote = result;
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				var src = _twig.twig({
					data: templates.git_push
				}).render({
					currentBranchName: main.getCurrentBranchName(),
					remote: git_remote
				});
				$elms.body.innerHTML = src;

				if( !git_remote.remotes.length ){
					$elms.body.querySelectorAll('button').forEach(function(elm){
						elm.disabled = true;
					});
				}
				rlv();
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				$elms.body.querySelector('button').addEventListener('click', function(){
					px2style.loading();
					var formElements = $elms.body.querySelectorAll('button');
					formElements.forEach(function(elm){
						elm.disabled = true;
					});

					var remoteName = $elms.body.querySelector('input[type=radio][name=remote_name]:checked').value;
					if( !remoteName ){
						alert('Select remote.');
						formElements.forEach(function(elm){
							elm.disabled = false;
						});
						px2style.closeLoading();
						return;
					}

					gitparse79.git(
						['push', remoteName, main.getCurrentBranchName()+':'+main.getCurrentBranchName()],
						function(result){
							console.log(result);
							// alert('refresh');
							$elms.body.querySelector('.gitui79__result-stdout code').innerHTML = result.stdout;
							formElements.forEach(function(elm){
								elm.disabled = false;
							});
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
