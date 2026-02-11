/**
 * page: status
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
	// バイナリデータ（Uint8Array）をBase64に変換する
	function binaryDataToBase64(uint8Array){
		try{
			// toBase64()が利用可能な場合はそれを使用、なければbtoaを使用
			if (typeof uint8Array.toBase64 === 'function') {
				return uint8Array.toBase64();
			} else {
				// フォールバック: btoaを使用
				return btoa(String.fromCharCode.apply(null, uint8Array));
			}
		}catch(e){
			console.error('Failed to encode binary data to base64:', e);
			return null;
		}
	}

	// --------------------------------------
	// 画像データをBase64で取得する（Git経由）
	function getImageDataBase64(ref, file, callback){
		gitparse79.git(
			['show', ref + ':' + file],
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
					var base64 = binaryDataToBase64(uint8Array);
					callback(base64);
				}catch(e){
					console.error('Failed to encode image:', e);
					callback(null);
				}
			}
		);
	}

	// --------------------------------------
	// 作業ツリーまたはインデックスから画像ファイルを取得する
	function getWorkingTreeImageBase64(file, isStaged, callback){
		if(isStaged == 'staged'){
			// ステージング済みの場合はインデックスから取得
			getImageDataBase64(':0', file, callback);
		}else{
			// 作業ツリーから直接ファイルを読み込む
			// Gitコマンドでは作業ツリーのファイルを直接読めないため、
			// options.getWorkingTreeFile コールバックを使用する
			if (main.options.getWorkingTreeFile) {
				main.options.getWorkingTreeFile(file, function(error, binaryData) {
					if (error || !binaryData) {
						callback(null);
						return;
					}
					// Uint8Array を Base64 に変換
					var base64 = binaryDataToBase64(binaryData);
					callback(base64);
				});
			} else {
				// コールバックが設定されていない場合は取得不可
				callback(null);
			}
		}
	}

	// --------------------------------------
	// 画面を初期化
	function init(){
		$elms.body.innerHTML = '';
		var git_status;

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				px2style.loading();
				rlv();
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				gitparse79.git(
					['fetch', '--prune'],
					function(result){
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// --------------------------------------
				// 状態情報を取得
				gitparse79.git(
					['status', '-u'],
					function(result){
						git_status = result;
						main.setCurrentBranchName(git_status.currentBranchName);
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// --------------------------------------
				// 状態情報を表示
				var src = main.bindTwig( require('-!text-loader!./templates/git_status.twig'), {
					status: git_status,
					currentBranchName: main.getCurrentBranchName(),
					committer: main.getCommitter()
				} );

				$elms.body.innerHTML = src;

				rlv();
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// --------------------------------------
				// 差分表示

				$($elms.body).find('.gitui79__list-changes a').on('click', function(){
					var file = $(this).attr('data-file');
					var status = $(this).attr('data-status');
					var isStaged = $(this).attr('data-is-staged');
					showDiff(file, status, isStaged);
				});

				rlv();
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// --------------------------------------
				// コミットボタンの処理
				var blockOpenCommitForm = document.querySelector('.gitui79__btn-block-open-commit-form');
				var btnOpenCommitForm = document.querySelector('.gitui79__btn-block-open-commit-form button.gitui79__cont-btn-commit');
				var btnDiscardAll = document.querySelector('.gitui79__btn-block-open-commit-form button.gitui79__cont-btn-discard');
				var blockCommitForm = document.querySelector('.gitui79__cont-commit-form');
				var commitForm = document.querySelector('.gitui79__cont-commit-form form');

				if( !btnOpenCommitForm ){
					// 変更がない場合はボタンが描画されない
					rlv();
					return;
				}

				// コミットボタン
				btnOpenCommitForm.addEventListener('click', function(){
					blockOpenCommitForm.style.display = 'none';
					blockCommitForm.style.display = 'block';
				});
				commitForm.addEventListener('submit', function(){
					var messageInput = this.querySelector('textarea');
					var message = messageInput.value;
					if( !message ){
						alert(main.lb.get('status.enter_commit_message'));
						messageInput.focus();
						return;
					}

					var committerNameInput = this.querySelector('input[name="committer.name"]');
					var committerName = committerNameInput.value;
					if( !committerName ){
						alert(main.lb.get('status.enter_committer_name'));
						committerNameInput.focus();
						return;
					}

					var committerEmailInput = this.querySelector('input[name="committer.email"]');
					var committerEmail = committerEmailInput.value;
					if( !committerEmail ){
						alert(main.lb.get('status.enter_committer_email'));
						committerEmailInput.focus();
						return;
					}
					commitForm.querySelectorAll('input, button, select, textarea').forEach(function(elm){
						elm.disabled = true;
					});
					commitAll( message, {name: committerName, email: committerEmail} );
				});

				// 変更を破棄するボタン
				btnDiscardAll.addEventListener('click', function(){
					if( !confirm(main.lb.get('status.confirm_discard_all')) ){
						return;
					}
					px2style.loading();
					discardAll( function(){
						px2style.closeLoading();
						alert(main.lb.get('status.discarded'));
						main.pages.load('status');
					} );
				});
				rlv();
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				px2style.closeLoading();
				rlv();
			}); })
		;
	}

	// --------------------------------------
	// 差分を表示する
	function showDiff( file, status, isStaged ){
		var diffInfo;
		var diffText = '';
		var diffHtmlLineByLine = '';
		var diffHtmlSideBySide = '';
		var isNewFile = false;
		var isImage = isImageFile(file);
		var imageDataBefore = null;
		var imageDataAfter = null;
		var mimeType = 'image/png';
		px2style.loading();

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

		// 新規ファイルかどうかを判定
		// `untracked` の場合は新規ファイル
		if( status === 'untracked'){
			isNewFile = true;
		}

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				if(!isImage){
					// 画像ファイル以外は通常の処理
					if( isNewFile ){
						// 新規ファイルの場合は、ファイル内容を取得
						if( isStaged == 'staged' ){
							// ステージングされた新規ファイルの内容を取得
							// git show :0:filename でインデックスのファイル内容を取得
							gitparse79.git(
								['show', ':0:' + file],
								function(result){
									diffInfo = result;
									rlv();
								}
							);
						} else {
							// ステージングされていない新規ファイル（untrackedファイル）の場合
							// git diff --no-index /dev/null <file> で差分を取得
							// これにより、空ファイルと現在のファイルの差分が取得できる
							gitparse79.git(
								['diff', '--no-index', '-U12', '/dev/null', file],
								function(result){
									// exit code 1 は差分がある場合の正常終了
									if( result.code === 1 || result.code === 0 ){
										diffInfo = {
											code: 0,
											stdout: result.stdout,
											stderr: result.stderr,
											errors: []
										};
									} else {
										diffInfo = result;
									}
									rlv();
								}
							);
						}
					} else {
						// 既存ファイルの差分を取得
						var diffCmd = [];
						diffCmd.push('diff');
						diffCmd.push('-U12');
						if( isStaged == 'staged' ){
							diffCmd.push('--cached');
						}
						diffCmd.push('--');
						diffCmd.push(file);
						gitparse79.git(
							diffCmd,
							function(result){
								diffInfo = result;
								rlv();
							}
						);
					}
				}else{
					// 画像ファイルの場合はBase64データを取得
					if(status === 'deleted'){
						// 削除ファイルの場合はHEADのみ取得
						getImageDataBase64('HEAD', file, function(data){
							imageDataBefore = data;
							diffInfo = { code: 0, errors: [] };
							rlv();
						});
					}else if(status === 'untracked' || isNewFile){
						// 新規ファイルの場合
						if(isStaged == 'staged'){
							// ステージング済み新規ファイル: インデックスから取得
							getImageDataBase64(':0', file, function(data){
								imageDataAfter = data;
								diffInfo = { code: 0, errors: [] };
								rlv();
							});
						}else{
							// untracked ファイル: getWorkingTreeImageBase64() で取得
							getWorkingTreeImageBase64(file, isStaged, function(data){
								imageDataAfter = data;
								diffInfo = { code: 0, errors: [] };
								rlv();
							});
						}
					}else{
						// 変更ファイルの場合
						if(isStaged == 'staged'){
							// ステージング済み: HEADとインデックスを比較
							getImageDataBase64('HEAD', file, function(dataBefore){
								imageDataBefore = dataBefore;
								getImageDataBase64(':0', file, function(dataAfter){
									imageDataAfter = dataAfter;
									diffInfo = { code: 0, errors: [] };
									rlv();
								});
							});
						}else{
							// ステージングされていない変更: HEADと作業ツリーを比較
							getImageDataBase64('HEAD', file, function(dataBefore){
								imageDataBefore = dataBefore;
								// 作業ツリーの画像を getWorkingTreeImageBase64() で取得
								getWorkingTreeImageBase64(file, isStaged, function(dataAfter){
									imageDataAfter = dataAfter;
									diffInfo = { code: 0, errors: [] };
									rlv();
								});
							});
						}
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
				} else if(!isImage){
					// 画像ファイル以外は diff2html で処理
					// --------------------------------------
					// diff2html
					if( isNewFile && isStaged == 'staged' ){
						// ステージ済み新規ファイルの場合、unified diff形式を手動で作成
						var fileContent = diffInfo.stdout || '';
						var lines = fileContent.split('\n');
						
						// 末尾の空行を除外（splitの結果、最後が空文字列になる場合がある）
						if( lines.length > 0 && lines[lines.length - 1] === '' ){
							lines.pop();
						}
						
						// unified diff形式のヘッダーを作成
						diffText = 'diff --git a/' + file + ' b/' + file + '\n';
						diffText += 'new file mode 100644\n';
						diffText += 'index 0000000..0000000\n';
						diffText += '--- /dev/null\n';
						diffText += '+++ b/' + file + '\n';
						diffText += '@@ -0,0 +1,' + lines.length + ' @@\n';
						
						// 各行に + プレフィックスを追加
						for( var i = 0; i < lines.length; i++ ){
							diffText += '+' + lines[i];
							if( i < lines.length - 1 ){
								diffText += '\n';
							}
						}
						// 最後に改行を追加（unified diff形式の規則）
						if( lines.length > 0 ){
							diffText += '\n';
						}
					} else if( isNewFile && isStaged != 'staged' ){
						// untracked ファイルの場合、git diff --no-index の出力をそのまま使用
						// ただし、パス表記を調整する必要がある場合がある
						diffText = diffInfo.stdout;
						
						// /dev/null の表記を a/ に、実際のファイルパスを b/ に統一
						// git diff --no-index の出力形式を normalized する
						if( diffText ){
							// 既に unified diff 形式なのでそのまま使用
							// 必要に応じてパス正規化
							diffText = diffText.replace(/^--- \/dev\/null/gm, '--- /dev/null');
							diffText = diffText.replace(/^\+\+\+ b\//gm, '+++ b/');
						}
					} else {
						diffText = diffInfo.stdout;
					}

					if( !diffInfo.errors || !diffInfo.errors.length ){
						const Diff2html = require('diff2html');
						diffHtmlLineByLine = Diff2html.html(
							Diff2html.parse( diffText ),
							{
								drawFileList: false,
								outputFormat: 'line-by-line',
								colorScheme: 'auto',
							}
						);
						diffHtmlSideBySide = Diff2html.html(
							Diff2html.parse( diffText ),
							{
								drawFileList: false,
								outputFormat: 'side-by-side',
								colorScheme: 'auto',
							}
						);
					}
					// / diff2html
					// --------------------------------------
					rlv();
				}
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				var src = main.bindTwig(
					require('-!text-loader!./templates/diff.twig'),
					{
						file: file,
						status: status,
						isStaged: isStaged,
						isImage: isImage,
						imageDataBefore: imageDataBefore,
						imageDataAfter: imageDataAfter,
						imageMetadataBefore: window._gitui79_imageMetadataBefore || null,
						imageMetadataAfter: window._gitui79_imageMetadataAfter || null,
						mimeType: mimeType,
						code: diffText,
						diffHtmlLineByLine,
						diffHtmlSideBySide,
					}
				);
				// グローバル変数をクリア
				delete window._gitui79_imageMetadataBefore;
				delete window._gitui79_imageMetadataAfter;
				var $body = $('<div>')
					.addClass('gitui79')
					.addClass('gitui79__body')
					.attr('data-page-name', 'status')
					.append(src);
				$body.find('.gitui79__resolve-ours').on('click', function(){
					alert(main.lb.get('status.resolve_ours_confirm'));
					px2style.loading();
					resolveFile(file, 'ours', function(){
						px2style.closeLoading();
						px2style.closeModal();
						main.pages.load('status');
					});
				});
				$body.find('.gitui79__resolve-theirs').on('click', function(){
					alert(main.lb.get('status.resolve_theirs_confirm'));
					px2style.loading();
					resolveFile(file, 'theirs', function(){
						px2style.closeLoading();
						px2style.closeModal();
						main.pages.load('status');
					});
				});
				var $rollbackButton = $('<button>')
					.text(main.lb.get('status.cancel_changes'))
					.addClass('px2-btn')
					.attr('type', 'button')
					.on('click', function(){
						if( !confirm(main.lb.get('status.confirm_cancel_change')) ){
							callback();
							return;
						}
						px2style.loading();
						discardFile( file, status, isStaged, function(){
							px2style.closeLoading();
							px2style.closeModal();
							main.pages.load('status');
						} );
					})
				;

				px2style.modal(
					{
						title: main.lb.get('status.detail'),
						body: $body,
						width: '100%',
						buttons: [
							'<button type="submit" class="px2-btn px2-btn--primary">'+main.lb.get('ui_label.close')+'</button>'
						],
						buttonsSecondary: [
							$rollbackButton
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
		return;
	}


	/**
	 * コミットする
	 */
	function commitAll( message, committer ){
		if( !message ){
			return false;
		}
		committer = committer || main.getCommitter();
		if( !committer.name || !committer.email ){
			return false;
		}

		px2style.loading();
		px2style.loadingMessage(main.lb.get('status.committing'));

		let isSuccess = true;

		it79.fnc({}, [
			function(it){
				gitparse79.git(
					['add', '--all', './'],
					function(result){
						if( result.code ){
							isSuccess = false;
							alert(
								main.lb.get(
									'status.commit_error_detail',
									{code: result.code, stdout: result.stdout}
								)
							);
						}
						it.next();
					}
				);
			},
			function(it){
				gitparse79.git(
					[
						'commit',
						'-m', message,
						'--author="'+main.escapeShell(committer.name)+' <'+main.escapeShell(committer.email)+'>"'
					],
					function(result){
						if( result.code ){
							isSuccess = false;
								alert(
									main.lb.get(
										'status.commit_error_detail',
										{code: result.code, stdout: result.stdout}
									)
								);
						}
						it.next();
					}
				);
			},
			function(it){
				if( !isSuccess ){
						main.flashMessage(main.lb.get('status.commit_failed'));
						px2style.loadingMessage(main.lb.get('status.commit_failed'));
				}else{
						main.flashMessage(main.lb.get('status.commit_succeeded'));
						px2style.loadingMessage(main.lb.get('status.commit_succeeded'));
				}
				setTimeout(function(){
					px2style.closeLoading();
					main.pages.load('status');
				}, 500);
			},
		]);
	}


	/**
	 * 単ファイルの競合状態を解決する
	 */
	function resolveFile( file, direction, callback ){
		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				gitparse79.git(
					['checkout', '--'+direction, file],
					function(result){
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				gitparse79.git(
					['add', file],
					function(result){
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				callback();
			}); })
		;
	}



	/**
	 * 単ファイルの変更を破棄する
	 */
	function discardFile( file, status, isStaged, callback ){
		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				if( status != 'untracked' || isStaged != 'staged' ){
					rlv();
					return;
				}
				// ステージング済みの新規ファイルは、
				// 一旦 unstage する。
				gitparse79.git(
					['reset', 'HEAD', file],
					function(result){
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				if( status == 'untracked' ){
					gitparse79.git(
						['clean', '-f', file],
						function(result){
							rlv();
						}
					);
				}else{
					gitparse79.git(
						['checkout', 'HEAD', file],
						function(result){
							rlv();
						}
					);
				}
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				callback();
			}); })
		;
	}

	/**
	 * 変更を破棄する
	 */
	function discardAll( callback ){
		var git_status;

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				// 一旦ぜんぶを unstage する。
				gitparse79.git(
					['reset', 'HEAD', './'],
					function(result){

						// 戻せるものは全部戻す
						gitparse79.git(
							['checkout', 'HEAD', './'],
							function(result){
								rlv();
							}
						);
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				gitparse79.git(
					['status', '-u'],
					function(result){
						git_status = result;
						main.setCurrentBranchName(git_status.currentBranchName);
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				it79.ary(
					['staged', 'notStaged'],
					function( it1, isStaged, idx1 ){
						it79.ary(
							['deleted', 'modified', 'untracked'],
							function( it2, status, idx2 ){
								var files = git_status[isStaged][status];
								it79.ary(
									files,
									function( it3, file, idx3 ){
										px2style.loadingMessage( file );
										discardFile( file, status, isStaged, function(){
											it3.next();
										} );
									},
									function(){
										it2.next();
									}
								);
							},
							function(){
								it1.next();
							}
						);
					},
					function(){
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				it79.ary(
					['bothAdded', 'bothModified'],
					function( it2, status, idx2 ){
						var files = git_status.unmerged[status];
						it79.ary(
							files,
							function( it3, file, idx3 ){
								px2style.loadingMessage( file );
								discardFile( file, status, 'noStaged', function(){
									it3.next();
								} );
							},
							function(){
								it2.next();
							}
						);
					},
					function(){
						rlv();
					}
				);
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				callback();
			}); })
		;

	}



	return init;
}
