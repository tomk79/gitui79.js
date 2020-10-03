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
	this.pages.status = require('../pages/status/page.js')(main, $elms, gitparse79);

	/**
	 * page: branch
	 */
	this.pages.branch = require('./pages/branch.js')(main, $elms, templates, gitparse79);

	/**
	 * page: log
	 */
	this.pages.log = require('./pages/log.js')(main, $elms, templates, gitparse79);

	/**
	 * page: pull
	 */
	this.pages.pull = require('./pages/pull.js')(main, $elms, templates, gitparse79);

	/**
	 * page: push
	 */
	this.pages.push = require('./pages/push.js')(main, $elms, templates, gitparse79);


}
