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
		"git_status": require('./resources/templates/git_status.html')
	};

	var committer = {
		name: "",
		email: ""
	};

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

	/**
	 * page: status
	 */
	this.pageStatus = function(){
		$elms.body.innerHTML = '';
		var git_status,
			git_log;

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				gitparse79.git(
					['status'],
					function(result){
						console.log(result);
						git_status = result;
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				gitparse79.git(
					['log', '-p'],
					function(result){
						console.log(result);
						git_log = result;
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				var src = _twig.twig({
					data: templates.git_status
				}).render({
					status: git_status,
					log: git_log,
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
