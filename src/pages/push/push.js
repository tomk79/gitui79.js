/**
 * page: push
 */
module.exports = function(main, $elms, gitparse79){
	var px2style = main.px2style;

	return function(){
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
				var src = main.bindTwig( require('-!text-loader!./templates/git_push.twig'), {
					currentBranchName: main.getCurrentBranchName(),
					remote: git_remote
				} );
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

					var gitCmd = [];
					gitCmd.push('push');
					if( $elms.body.querySelector('input[type=checkbox][name=force]:checked') ){
						if( !confirm('強制的にプッシュします。この操作は、リモートブランチを上書きします。続けますか？') ){
							formElements.forEach(function(elm){
								elm.disabled = false;
							});
							px2style.closeLoading();
							return;
						}
						gitCmd.push('-f');
					}
					gitCmd.push(remoteName);
					gitCmd.push(main.getCurrentBranchName()+':'+main.getCurrentBranchName());
					gitparse79.git(
						gitCmd,
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
