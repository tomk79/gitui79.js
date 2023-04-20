/**
 * main.js
 */
module.exports = function($elm, fncCallGit, options){
	var Twig = require('twig');
	var LangBank = require('langbank');
	var languageCsv = require('../languages/language.csv');
	var main = this;
	options = options || {};
	options.committer = options.committer || {};
	options.lang = options.lang || "ja";

	var gitparse79 = new (require('gitparse79'))(fncCallGit);
	require('px2style/dist/px2style.js');
	var px2style = window.px2style;
	this.px2style = px2style;

	var $elms = {};

	var committer = {
		name: "",
		email: ""
	};
	var currentBranchName;

	this.lb;
	this.pages = new (require('./pages.js'))(main, gitparse79, $elms);

	/**
	 * GitUi79 を初期化します。
	 */
	this.init = function( callback ){
		callback = callback || function(){};

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				main.lb = new LangBank(languageCsv, ()=>{
					main.lb.setLang( options.lang );
					rlv();
				});
			}); })
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
				$elm.innerHTML = main.bindTwig( require('-!text-loader!../resources/templates/mainframe.twig'), {} );

				// buttons
				$elm.querySelector('.gitui79__btn--status').addEventListener('click', function(e){
					main.pages.load('status');
				});
				$elm.querySelector('.gitui79__btn--branch').addEventListener('click', function(e){
					main.pages.load('branch');
				});
				$elm.querySelector('.gitui79__btn--log').addEventListener('click', function(e){
					main.pages.load('log');
				});
				$elm.querySelector('.gitui79__btn--pull').addEventListener('click', function(e){
					main.pages.load('pull');
				});
				$elm.querySelector('.gitui79__btn--push').addEventListener('click', function(e){
					main.pages.load('push');
				});

				// elm
				$elms.elm = $elm;

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
				main.pages.load('status');
				rlv();
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				callback();
				rlv();
			}); })
		;
	}

	/**
	 * コミットメッセージを解析する
	 */
	this.parseCommitMessage = function(message){
		var msgLines = message.split(/\r\n|\r|\n/);
		var title = msgLines.shift();
		var body = msgLines.join("\n");
		return {
			title: title,
			body: body
		};
	}

	/**
	 * Set current branch name
	 */
	this.setCurrentBranchName = function(val){
		currentBranchName = val;
		return true;
	}
	/**
	 * Get current branch name
	 */
	this.getCurrentBranchName = function(){
		return currentBranchName;
	}

	/**
	 * Get committer info
	 */
	this.getCommitter = function(){
		return committer;
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

	/**
	 * Twig テンプレートを処理する
	 */
	this.bindTwig = function( templateSrc, bindData ){
		var data = {
			"lb": main.lb,
			...bindData,
		};
		var template = Twig.twig({
			data: templateSrc,
		});
		return template.render(data);
	}
}
