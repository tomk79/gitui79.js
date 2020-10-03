/**
 * page: log
 */
module.exports = function(main, $elms, gitparse79){
	var _twig = require('twig');
	var templates = {
		"git_show": require('./templates/git_show.html'),
		"git_log": require('./templates/git_log.html'),
		"git_log_rows": require('./templates/git_log_rows.html')
	};


	// --------------------------------------
	// コミットの詳細を表示する
	function showCommitDetails( commit ){
		px2style.loading();
		gitparse79.git(
			['show', commit],
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
						showCommitFile(file);
					})
				;
			}
		);
	}

	// --------------------------------------
	// コミットに含まれるファイルの情報を表示する
	function showCommitFile(file){
		px2style.loading();

		var $body = $('<div>').text(file);

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				px2style.modal(
					{
						title: file,
						body: $body,
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
}
