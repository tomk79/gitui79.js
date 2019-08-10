/**
 * GitUi79
 */
window.GitUi79 = function($elm, fncCallGit, options){
	var _this = this;
	options = options || {};

	var gitparse79 = new window.GitParse79(fncCallGit);

	var $elms = {};

	var templates = {
		"mineFrame": '<div class="gitui79__toolbar">'
				+ '<ul>'
				+ '<li><button class="gitui79__btn gitui79__btn--status">status</button></li>'
				+ '</ul>'
				+ '</div>'
				+ '<div class="gitui79__body"></div>'
				+ '<div class="gitui79__statusbar"></div>'
	};

	/**
	 * GitUi79 を初期化します。
	 */
	this.init = function( callback ){
		callback = callback || function(){};
		$elm.classList.add("gitui79");
		$elm.innerHTML = templates.mineFrame;

		// buttons
		$elm.getElementsByClassName('gitui79__btn--status')[0].addEventListener('click', function(e){
			_this.pageStatus();
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
		gitparse79.git(
			['status'],
			function(result){
				console.log(result);
				// alert('refresh');
				var src = '';
				src += '<ul class="gitui79__list-status">';
				function mksrc(ary, isStaged, status){
					var src = '';
					ary.forEach(function(row){
						src += '<li class="'+(isStaged ? 'gitui79__list-status-staged' : '')+' '+('gitui79__list-status-'+status)+'">';
						src += row;
						src += '</li>';
					});
					return src;
				}
				src += mksrc(result.notStaged.untracked, false, 'untracked');
				src += mksrc(result.notStaged.modified, false, 'modified');
				src += mksrc(result.notStaged.deleted, false, 'deleted');
				src += mksrc(result.staged.untracked, true, 'untracked');
				src += mksrc(result.staged.modified, true, 'modified');
				src += mksrc(result.staged.deleted, true, 'deleted');
				src += '</ul>';
				$elms.body.innerHTML = src;
			}
		);
	}
}
