/**
 * GitUi79
 */
window.GitUi79 = function($elm, fncCallGit, options){
	var _this = this;
	options = options || {};

	var gitparse79 = new window.GitParse79(fncCallGit);
	var _twig = require('twig');

	var $elms = {};

	var templates = {
		"mainframe": require('./resources/templates/mainframe.html'),
		"git_status": require('./resources/templates/git_status.html')
	};

	/**
	 * GitUi79 を初期化します。
	 */
	this.init = function( callback ){
		callback = callback || function(){};
		$elm.classList.add("gitui79");
		$elm.innerHTML = templates.mainframe;

		// buttons
		$elm.getElementsByClassName('gitui79__btn--status')[0].addEventListener('click', function(e){
			_this.pageStatus();
		});
		$elm.getElementsByClassName('gitui79__btn--pull')[0].addEventListener('click', function(e){
			_this.pagePull();
		});
		$elm.getElementsByClassName('gitui79__btn--commit')[0].addEventListener('click', function(e){
			_this.pageCommit();
		});
		$elm.getElementsByClassName('gitui79__btn--push')[0].addEventListener('click', function(e){
			_this.pagePush();
		});

		// body
		$elms.body = $elm.getElementsByClassName('gitui79__body')[0];

		// initialize page
		_this.pageStatus();

		callback();
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
					log: git_log
				});

				$elms.body.innerHTML = src;

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
	 * page: commit
	 */
	this.pageCommit = function(){
		$elms.body.innerHTML = '';
		var message = prompt('Commit message?');
		if(!message){
			return;
		}
		gitparse79.git(
			['add', './'],
			function(result){
				console.log(result);
				gitparse79.git(
					['commit', '-m', message],
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
