/**
 * GitUi79
 */
window.GitUi79 = function($elm, fncCallGit, options){
	var _this = this;
	options = options || {};
	options.committer = options.committer || {};

	var gitparse79 = new window.GitParse79(fncCallGit);
	var _twig = require('twig');

	var $elms = {};

	var templates = {
		"mainframe": require('./resources/templates/mainframe.html'),
		"git_status": require('./resources/templates/git_status.html'),
		"git_show": require('./resources/templates/git_show.html'),
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
				$elm.getElementsByClassName('gitui79__btn--status')[0].addEventListener('click', function(e){
					_this.pageStatus();
				});
				$elm.getElementsByClassName('gitui79__btn--log')[0].addEventListener('click', function(e){
					_this.pageLog();
				});
				$elm.getElementsByClassName('gitui79__btn--pull')[0].addEventListener('click', function(e){
					_this.pagePull();
				});
				$elm.getElementsByClassName('gitui79__btn--push')[0].addEventListener('click', function(e){
					_this.pagePush();
				});

				// body
				$elms.body = $elm.querySelector('.gitui79__body');

				rlv();
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// initialize page
				_this.pageStatus();
				rlv();
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				callback();
				rlv();
			}); })
		;
	}

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
	this.pageStatus = function(){
		$elms.body.innerHTML = '';
		var git_status;

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				gitparse79.git(
					['status'],
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
									// alert('refresh');
									_this.pageStatus();
								}
							);
						}
					);

				});
				rlv();
			}); })
		;
	}

	/**
	 * page: log
	 */
	this.pageLog = function(){
		$elms.body.innerHTML = '';
		var git_log;
		var dpp = 50;
		var currentPage = 0;

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
							rlv();
						}
					);
				});
				rlv();
			}); })
		;
	}

	/**
	 * page: pull
	 */
	this.pagePull = function(){
		$elms.body.innerHTML = '';
		gitparse79.git(
			['pull'],
			function(result){
				console.log(result);
				// alert('refresh');
				var src = '';
				src += '<pre><code>';
				src += '</code></pre>';
				$elms.body.innerHTML = src;
				$elms.body.getElementsByTagName('code')[0].innerHTML = result.stdout;
			}
		);
	}

	/**
	 * page: push
	 */
	this.pagePush = function(){
		$elms.body.innerHTML = '';
		gitparse79.git(
			['push'],
			function(result){
				console.log(result);
				// alert('refresh');
				var src = '';
				src += '<pre><code>';
				src += '</code></pre>';
				$elms.body.innerHTML = src;
				$elms.body.getElementsByTagName('code')[0].innerHTML = result.stdout;
			}
		);
	}
}
