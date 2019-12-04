/**
 * GitUi79
 */
window.GitUi79 = function($elm, fncCallGit, options){
	var _this = this;
	options = options || {};
	options.committer = options.committer || {};
	this.pages = {};

	var gitparse79 = new (require('gitparse79'))(fncCallGit);
	var _twig = require('twig');

	var $elms = {};

	var templates = {
		"mainframe": require('./resources/templates/mainframe.html'),
		"git_status": require('./resources/templates/git_status.html'),
		"git_show": require('./resources/templates/git_show.html'),
		"git_branch": require('./resources/templates/git_branch.html'),
		"git_push": require('./resources/templates/git_push.html'),
		"git_pull": require('./resources/templates/git_pull.html'),
		"git_log": require('./resources/templates/git_log.html'),
		"git_log_rows": require('./resources/templates/git_log_rows.html')
	};

	var committer = {
		name: "",
		email: ""
	};
	var currentBranchName;

	/**
	 * GitUi79 を初期化します。
	 */
	this.init = function( callback ){
		callback = callback || function(){};

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				if(options.committer.name){
					committer.name = options.committer.name;
					rlv();
					return;
				}
				gitparse79.git(
					['config', 'user.name'],
					function(result){
						console.log(result);
						committer.name = result.name;
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				if(options.committer.email){
					committer.email = options.committer.email;
					rlv();
					return;
				}
				gitparse79.git(
					['config', 'user.email'],
					function(result){
						console.log(result);
						committer.email = result.email;
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				$elm.classList.add("gitui79");
				$elm.innerHTML = templates.mainframe;

				// buttons
				$elm.querySelector('.gitui79__btn--status').addEventListener('click', function(e){
					loadPage('status');
				});
				$elm.querySelector('.gitui79__btn--branch').addEventListener('click', function(e){
					loadPage('branch');
				});
				$elm.querySelector('.gitui79__btn--log').addEventListener('click', function(e){
					loadPage('log');
				});
				$elm.querySelector('.gitui79__btn--pull').addEventListener('click', function(e){
					loadPage('pull');
				});
				$elm.querySelector('.gitui79__btn--push').addEventListener('click', function(e){
					loadPage('push');
				});

				// body
				$elms.body = $elm.querySelector('.gitui79__body');

				// statusbar
				$elms.statusbar = $elm.querySelector('.gitui79__statusbar');

				// tab
				$elm.querySelector('.gitui79__btn--status').classList.add('active');

				rlv();
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// initialize page
				_this.pages.status();
				rlv();
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				callback();
				rlv();
			}); })
		;
	}

	/**
	 * ページを開く
	 */
	function loadPage(pageName){
		$elm.querySelectorAll('.gitui79__toolbar a').forEach(function(elm){
			elm.classList.remove('active');
		});
		$elm.querySelector('.gitui79__btn--'+pageName).classList.add('active');
		_this.pages[pageName]();
	}

	/**
	 * コミットメッセージを解析する
	 */
	function parseCommitMessage(message){
		var msgLines = message.split(/\r\n|\r|\n/);
		var title = msgLines.shift();
		var body = msgLines.join("\n");
		return {
			title: title,
			body: body
		};
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
						currentBranchName = git_status.currentBranchName;
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				var src = _twig.twig({
					data: templates.git_status
				}).render({
					status: git_status,
					currentBranchName: currentBranchName,
					committer: committer
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
									'--author='+committer.name+' <'+committer.email+'>'
								],
								function(result){
									console.log(result);
									_this.flashMessage('コミットしました。');
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
	this.pages.branch = function(){
		$elms.body.innerHTML = '';
		var git_branch;

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				gitparse79.git(
					['branch', '-a'],
					function(result){
						console.log(result);
						git_branch = result;
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				var src = _twig.twig({
					data: templates.git_branch
				}).render({
					currentBranchName: currentBranchName,
					branch: git_branch
				});
				$elms.body.innerHTML = src;

				rlv();
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				$elms.body.querySelectorAll('a[data-branch-name]').forEach(function(elm){
					elm.addEventListener('click', function(){
						var branchName = this.getAttribute('data-branch-name');
						// alert(branchName);
						if( branchName.match(/^remotes\//) ){
							// alert('remotes!');
							var remoteBranchName = branchName.replace(/^remotes\//, '');
							var localBranchName = branchName.replace(/^remotes\/[^\/]*?\//, '');
							// alert(remoteBranchName);
							// alert(localBranchName);
							// return;
							gitparse79.git(
								['checkout', '-b', localBranchName, remoteBranchName],
								function(result){
									console.log(result);
									if( result.result ){
										currentBranchName = result.currentBranchName;
										loadPage('branch');
									}else{
										alert('Failed.');
									}
								}
							);
						}else{
							gitparse79.git(
								['checkout', branchName],
								function(result){
									console.log(result);
									if( result.result ){
										currentBranchName = result.currentBranchName;
										loadPage('branch');
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
						// alert(branchName);
						if( method == 'merge' ){
							// ブランチをマージ
							if( !confirm('ブランチ '+branchName+' を、 ' + currentBranchName + ' にマージしようとしています。' + "\n" + 'よろしいですか？') ){
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
									loadPage('branch');
								}
							);
						}else if( method == 'delete' ){
							// ブランチを削除
							if( !confirm('ブランチ '+branchName+' を、削除してもよろしいですか？') ){
								return;
							}
							if( branchName.match(/^remotes\//) ){
								// alert('remotes!');
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
										loadPage('branch');
									}
								);
							}else{
								gitparse79.git(
									['branch', '--delete', branchName],
									function(result){
										console.log(result);
										if(result.code){
											alert(result.stdout);
										}
										loadPage('branch');
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
								currentBranchName = result.currentBranchName;
								loadPage('branch');
							}else{
								alert('Failed.');
							}
						}
					);
				});
			}); })
		;
	}

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
				var parsedCommitMessage = parseCommitMessage(log.message);
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
							var splitedCommitMessage = parseCommitMessage(result.message);
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
					currentBranchName: currentBranchName,
					log: git_log,
					committer: committer,
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
					var _this = this;
					_this.disabled = true;
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
							_this.disabled = false;

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
					currentBranchName: currentBranchName,
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
						['pull', remoteName, currentBranchName+':'+currentBranchName],
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
					currentBranchName: currentBranchName,
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
						['push', remoteName, currentBranchName+':'+currentBranchName],
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
	 * フラッシュメッセージを表示する
	 */
	this.flashMessage = function( message, callback ){
		callback = callback || function(){}
		console.info(message);
		// $elms.statusbar.innerText = message;
		// setTimeout(function(){
		// 	$elms.statusbar.innerText = '';
		// }, 5000);
		callback();
	}
}
