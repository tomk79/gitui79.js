/**
 * page: log
 */
module.exports = function(main, $elms, gitparse79){
	var it79 = require('iterate79');
	var px2style = main.px2style;


	// --------------------------------------
	// 画像ファイルかどうかを判定する
	function isImageFile(filename){
		var imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webp', '.ico'];
		var ext = filename.toLowerCase().match(/\.[^.]+$/);
		if(!ext) return false;
		return imageExtensions.indexOf(ext[0]) !== -1;
	}

	// --------------------------------------
	// バイト数を読みやすい形式にフォーマット
	function formatBytes(bytes){
		if (bytes === 0) return '0 ' + main.lb.get('ui_label.bytes');
		var k = 1024;
		var sizes = [
			main.lb.get('ui_label.bytes'),
			main.lb.get('ui_label.kb'),
			main.lb.get('ui_label.mb'),
			main.lb.get('ui_label.gb')
		];
		var i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
	}

	// --------------------------------------
	// 画像のメタデータを取得する（サイズ、幅、高さ）
	function getImageMetadata(base64Data, mimeType, callback){
		if (!base64Data) {
			callback(null);
			return;
		}

		var img = new Image();
		img.onload = function() {
			// 容量を計算（Base64のデコードサイズ）
			var base64Length = base64Data.length;
			var padding = (base64Data.match(/=/g) || []).length;
			var byteSize = Math.floor((base64Length * 3) / 4) - padding;

			callback({
				width: img.width,
				height: img.height,
				size: byteSize,
				sizeFormatted: formatBytes(byteSize),
				format: mimeType
			});
		};
		img.onerror = function() {
			callback(null);
		};
		img.src = 'data:' + mimeType + ';base64,' + base64Data;
	}

	// --------------------------------------
	// 画像データをBase64で取得する
	function getImageDataBase64(commit, file, callback){
		gitparse79.git(
			['show', commit + ':' + file],
			function(result){
				if(result.code !== 0){
					callback(null);
					return;
				}
				// stdoutをBase64にエンコード（Uint8Arrayを使用）
				try{
					// バイナリデータをUint8Arrayに変換
					var uint8Array = new Uint8Array(result.stdout.length);
					for (var i = 0; i < result.stdout.length; i++) {
						uint8Array[i] = result.stdout.charCodeAt(i) & 0xff;
					}
					
					// toBase64()が利用可能な場合はそれを使用、なければbtoaを使用
					var base64;
					if (typeof uint8Array.toBase64 === 'function') {
						base64 = uint8Array.toBase64();
					} else {
						// フォールバック: btoaを使用
						base64 = btoa(String.fromCharCode.apply(null, uint8Array));
					}
					callback(base64);
				}catch(e){
					console.error('Failed to encode image:', e);
					callback(null);
				}
			}
		);
	}

	// --------------------------------------
	// コミットの詳細を表示する
	function showCommitDetails( commit ){
		px2style.loading();

		gitparse79.git(
			['show', '--name-status', commit],
			function(result){
				var splitedCommitMessage = main.parseCommitMessage(result.message);
				var src = main.bindTwig( require('-!text-loader!./templates/git_show.twig'), {
					commit: result,
					title: splitedCommitMessage.title,
					body: splitedCommitMessage.body,
				} );
				var $body = $('<div>')
					.addClass('gitui79')
					.addClass('gitui79__body')
					.attr('data-page-name', 'log')
					.html(src);
				px2style.modal(
					{
						title: splitedCommitMessage.title,
						body: $body,
						buttons: [
							'<button type="submit" class="px2-btn px2-btn--primary">'+main.lb.get('ui_label.close')+'</button>'
						],
						buttonsSecondary: [
							$('<button>')
								.text(main.lb.get('log.rollback_to_version'))
								.addClass('px2-btn')
								.attr('type', 'button')
								.on('click', function(){
									if( !confirm(main.lb.get('log.confirm_rollback_all')) ){
										return;
									}
									rollbackAll(commit);
								}),
							$('<button>')
								.text(main.lb.get('log.rollback_before_version'))
								.addClass('px2-btn')
								.attr('type', 'button')
								.on('click', function(){
									if( !confirm(main.lb.get('log.confirm_rollback_all')) ){
										return;
									}
									rollbackAll(commit+'~');
								}),
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
					}
				);
				$body.find('.gitui79__list-changes a')
					.on('click', function(){
						var file = $(this).attr('data-file');
						var status = $(this).attr('data-status');
						showCommitFile(commit, file, status);
					})
				;
			}
		);
	}

	// --------------------------------------
	// コミットに含まれるファイルの情報を表示する
	function showCommitFile(commit, file, status){
		px2style.loading();

		var $body;
		var modalTitle = file;
		modalTitle = modalTitle.replace(/^[\s\S]*?([^\/]*)$/, '$1');

		var diffHtmlLineByLine = '';
		var diffHtmlSideBySide = '';
		var isImage = isImageFile(file);
		var imageDataBefore = null;
		var imageDataAfter = null;
		var mimeType = 'image/png';

		// MIMEタイプを拡張子から判定
		if(isImage){
			var ext = file.toLowerCase().match(/\.[^.]+$/);
			if(ext){
				var mimeTypes = {
					'.png': 'image/png',
					'.jpg': 'image/jpeg',
					'.jpeg': 'image/jpeg',
					'.gif': 'image/gif',
					'.bmp': 'image/bmp',
					'.svg': 'image/svg+xml',
					'.webp': 'image/webp',
					'.ico': 'image/x-icon'
				};
				mimeType = mimeTypes[ext[0]] || 'image/png';
			}
		}

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				if(!isImage){
					// 画像ファイル以外は通常のdiff処理
					gitparse79.git(
						['diff', commit+'~', commit, '--', file],
						function(result){
							if( !result.errors.length ){
								// --------------------------------------
								// diff2html
								const Diff2html = require('diff2html');
								diffHtmlLineByLine = Diff2html.html(
									Diff2html.parse( result.stdout ),
									{
										drawFileList: false,
										outputFormat: 'line-by-line',
										colorScheme: 'auto',
									}
								);
								diffHtmlSideBySide = Diff2html.html(
									Diff2html.parse( result.stdout ),
									{
										drawFileList: false,
										outputFormat: 'side-by-side',
										colorScheme: 'auto',
									}
								);
								// / diff2html
								// --------------------------------------
							}
							rlv();
						}
					);
				}else{
					// 画像ファイルの場合はBase64データを取得
					if(status !== 'added'){
						// Before画像を取得（新規ファイル以外）
						getImageDataBase64(commit+'~', file, function(data){
							imageDataBefore = data;
							if(status === 'deleted'){
								// 削除ファイルの場合はBeforeのみ
								rlv();
							}else{
								// After画像を取得（変更ファイル）
								getImageDataBase64(commit, file, function(data){
									imageDataAfter = data;
									rlv();
								});
							}
						});
					}else{
						// 新規ファイルの場合はAfterのみ
						getImageDataBase64(commit, file, function(data){
							imageDataAfter = data;
							rlv();
						});
					}
				}
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				if(isImage){
					// 画像のメタデータを取得
					var metadataCount = 0;
					var metadataTotal = (imageDataBefore ? 1 : 0) + (imageDataAfter ? 1 : 0);
					var imageMetadataBefore = null;
					var imageMetadataAfter = null;

					if (metadataTotal === 0) {
						// 画像データがない場合
						rlv();
						return;
					}

					if (imageDataBefore) {
						getImageMetadata(imageDataBefore, mimeType, function(metadata) {
							imageMetadataBefore = metadata;
							metadataCount++;
							if (metadataCount === metadataTotal) {
								// 画像メタデータを変数に格納
								window._gitui79_imageMetadataBefore = imageMetadataBefore;
								window._gitui79_imageMetadataAfter = imageMetadataAfter;
								rlv();
							}
						});
					}

					if (imageDataAfter) {
						getImageMetadata(imageDataAfter, mimeType, function(metadata) {
							imageMetadataAfter = metadata;
							metadataCount++;
							if (metadataCount === metadataTotal) {
								// 画像メタデータを変数に格納
								window._gitui79_imageMetadataBefore = imageMetadataBefore;
								window._gitui79_imageMetadataAfter = imageMetadataAfter;
								rlv();
							}
						});
					}
				} else {
					rlv();
				}
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				var src = main.bindTwig( require('-!text-loader!./templates/show_fileinfo.twig'), {
					file: file,
					status: status,
					isImage: isImage,
					imageDataBefore: imageDataBefore,
					imageDataAfter: imageDataAfter,
					imageMetadataBefore: window._gitui79_imageMetadataBefore || null,
					imageMetadataAfter: window._gitui79_imageMetadataAfter || null,
					mimeType: mimeType,
					diffHtmlLineByLine,
					diffHtmlSideBySide,
				} );
				// グローバル変数をクリア
				delete window._gitui79_imageMetadataBefore;
				delete window._gitui79_imageMetadataAfter;

				$body = $('<div>')
					.addClass('gitui79')
					.addClass('gitui79__body')
					.attr('data-page-name', 'log')
					.append(src);
				rlv();
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){

				px2style.modal(
					{
						title: modalTitle,
						body: $body,
						width: '100%',
						buttons: [
							'<button type="submit" class="px2-btn px2-btn--primary">'+main.lb.get('ui_label.close')+'</button>'
						],
						buttonsSecondary: [
							$('<button>')
								.text(main.lb.get('log.rollback_to_version'))
								.addClass('px2-btn')
								.attr('type', 'button')
								.on('click', function(){
									if( !confirm(main.lb.get('log.confirm_rollback_file')) ){
										return;
									}
									rollbackFile(commit, file, status);
								}),
							$('<button>')
								.text(main.lb.get('log.rollback_before_version'))
								.addClass('px2-btn')
								.attr('type', 'button')
								.on('click', function(){
									if( !confirm(main.lb.get('log.confirm_rollback_file')) ){
										return;
									}
									rollbackFile(commit+'~', file, status);
								}),
						],
						form: {
							action: 'javascript:;',
							method: 'get',
							submit: function(){
								px2style.closeModal();
							}
						},
					},
					function(){
						px2style.closeLoading();
					}
				);
			}); })
		;
	}


	// --------------------------------------
	// すべてのファイルをコミット時点の状態までロールバックする
	function rollbackAll(commit){
		px2style.loading();
		var diffFileList = [];

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				gitparse79.git(
					['checkout', commit, './'],
					function(result){
						rlv();
						return;
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				gitparse79.git(
					['diff', '--name-status', commit],
					function(result){
						diffFileList = result.diff;
						rlv();
						return;
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				it79.ary(
					diffFileList,
					function(itAry1, diffRow, diffIdx){
						px2style.loadingMessage( diffRow.filename );
						if( diffRow.type == 'added' ){
							gitparse79.git(
								['rm', diffRow.filename],
								function(result){
									itAry1.next();
									return;
								}
							);
							return;
						}else{
							gitparse79.git(
								['checkout', commit, diffRow.filename],
								function(result){
									itAry1.next();
									return;
								}
							);
						}
					},
					function(){
						rlv();
					}
				);
				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// unstage
				px2style.loadingMessage( main.lb.get('log.unstaging') );
				gitparse79.git(
					['reset', 'HEAD', './'],
					function(result){
						rlv();
						return;
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				px2style.closeLoading();
				alert(main.lb.get('log.rollback_success'));
				rlv();
			}); })
		;

	}

	// --------------------------------------
	// 指定のファイルをコミット時点の状態までロールバックする
	function rollbackFile(commit, file, status){
		px2style.loading();

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				// rollback
				if( status == 'deleted' ){
					gitparse79.git(
						['rm', file],
						function(result){
							rlv();
							return;
						}
					);
					return;
				}else{
					gitparse79.git(
						['checkout', commit, file],
						function(result){
							rlv();
							return;
						}
					);
				}
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// unstage
				gitparse79.git(
					['reset', 'HEAD', file],
					function(result){
						rlv();
						return;
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				px2style.closeLoading();
				alert(main.lb.get('log.rollback_file_success', {file: file}));
				rlv();
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
			if( !git_log || !git_log.logs || !git_log.logs.length ){
				return;
			}
			git_log.logs.forEach(function(log){
				var parsedCommitMessage = main.parseCommitMessage(log.message);
				log.messageTitle = parsedCommitMessage.title;
				log.messageBody = parsedCommitMessage.body;
			});
			var src_rows = main.bindTwig( require('-!text-loader!./templates/git_log_rows.twig'), {
				log: git_log
			} );

			$elms.body.querySelector('.gitui79__cont-list-commit-logs').innerHTML += src_rows;
			$elms.body.querySelectorAll('.gitui79__cont-list-commit-logs a').forEach(function(elm){
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
						git_log = result;
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				var src = main.bindTwig( require('-!text-loader!./templates/git_log.twig'), {
					currentBranchName: main.getCurrentBranchName(),
					log: git_log,
					committer: main.getCommitter(),
					dpp: dpp
				} );
				$elms.body.innerHTML = src;

				appendLogList(git_log);

				rlv();
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				if( !git_log || !git_log.logs || !git_log.logs.length || git_log.logs.length < dpp ){
					rlv();
				}

				var $btnNext = document.querySelector('.gitui79__btn-block-next-page button');
				$btnNext.addEventListener('click', function(){
					px2style.loading();
					var main = this;
					main.disabled = true;
					currentPage ++;
					gitparse79.git(
						['log', '--max-count='+(dpp), '--skip='+(dpp*currentPage)],
						function(result){
							git_log = result;

							appendLogList(git_log);

							if( !git_log.logs.length || git_log.logs.length < dpp ){
								document.querySelector('.gitui79__btn-block-next-page').style.display = 'none';
							}
							main.disabled = false;

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
