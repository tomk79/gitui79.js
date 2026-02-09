# gitui79.js

## Usage

gitコマンドの出力には画像などのバイナリデータが含まれる場合があるため、サーバー側とクライアント側で以下のようにBase64エンコード/デコード処理を実装してください。

### サーバー側の実装例

```javascript
// Gitコマンドの出力をBufferで保持し、Base64エンコードして返す
app.use('/apis/git', function(req, res, next){
    var cmdAry = req.body.cmdAry;
    
    var stdoutBuffers = [];
    var stderrBuffers = [];
    
    var proc = require('child_process').spawn('git', cmdAry);
    proc.stdout.on('data', function(data){
        stdoutBuffers.push(data);
    });
    proc.stderr.on('data', function(data){
        stderrBuffers.push(data);
    });
    proc.on('close', function(code){
        // Bufferを結合してBase64エンコード
        var stdoutBuffer = Buffer.concat(stdoutBuffers);
        var stderrBuffer = Buffer.concat(stderrBuffers);
        
        res.send(JSON.stringify({
            code: code,
            stdout: stdoutBuffer.toString('base64'),
            stderr: stderrBuffer.toString('base64'),
            encoding: 'base64'
        }));
    });
});
```

### クライアント側の実装例

```html
<div id="gitui79"></div>

<script>
var gitUi79 = new GitUi79(
    document.getElementById('gitui79'),
    function(cmdAry, callback){
        var stdout = null;
        var stderr = null;
        $.ajax({
            url: '/apis/git',
            method: 'POST',
            data: {"cmdAry": cmdAry},
            success: function(data){
                stdout = data;
            },
            error: function(data){
                stderr = data;
            },
            complete: function(){
                var result = JSON.parse(stdout);
                
                // Base64エンコードされたデータをデコード
                var decodedStdout = result.stdout;
                var decodedStderr = result.stderr;
                
                if (result.encoding === 'base64') {
                    try {
                        // Base64デコードしてUint8Arrayに変換
                        var binaryStdout = atob(result.stdout);
                        var binaryStderr = atob(result.stderr);
                        
                        // バイナリ文字列をUint8Arrayに変換
                        var uint8ArrayStdout = new Uint8Array(binaryStdout.length);
                        var uint8ArrayStderr = new Uint8Array(binaryStderr.length);
                        
                        for (var i = 0; i < binaryStdout.length; i++) {
                            uint8ArrayStdout[i] = binaryStdout.charCodeAt(i);
                        }
                        for (var i = 0; i < binaryStderr.length; i++) {
                            uint8ArrayStderr[i] = binaryStderr.charCodeAt(i);
                        }
                        
                        // UTF-8としてデコードを試みる
                        try {
                            var decoder = new TextDecoder('utf-8', { fatal: true });
                            decodedStdout = decoder.decode(uint8ArrayStdout);
                            decodedStderr = decoder.decode(uint8ArrayStderr);
                        } catch(utf8Error) {
                            // UTF-8デコードに失敗した場合、バイナリデータとして扱う
                            decodedStdout = binaryStdout;
                            decodedStderr = binaryStderr;
                        }
                    } catch(e) {
                        console.error('Base64 decode error:', e);
                    }
                }
                
                callback(result.code, decodedStdout, decodedStderr);
            }
        });
        return;
    },
    {
        "committer": {
            "name": "Committer Name",
            "email": "committer@example.com",
        },
        "lang": "ja",
    }
);
gitUi79.init(function(){
    console.log('ready.');
});
</script>
```

## 更新履歴 - Change log

### gitui79 v0.7.0 (リリース日未定)

- 新規ファイルの内容を、差分として確認できるようになった。
- 画像ファイルを確認できるようになった。

### gitui79 v0.6.1 (2026年1月10日)

- ブランチ操作が常に失敗を報告する問題を修正。
- 新規ブランチ作成のUIを改善。
- 多言語対応に関する修正。

### gitui79 v0.6.0 (2025年11月16日)

- アピアランス対応の強化。

### gitui79 v0.5.1 (2024年12月25日)

- レイアウトに関する細かい修正。

### gitui79 v0.5.0 (2024年10月7日)

- エスケープ処理を改善した。
- エラー処理に関するいくつかの改善。

### gitui79 v0.4.0 (2024年4月30日)

- px2style を分離した。
- px2style を統合した bundledビルドを追加。

### gitui79 v0.3.5 (2024年2月18日)

- 差分表示に関する改善。

### gitui79 v0.3.4 (2023年11月13日)

- ダークモード用のスタイルをバンドルした。

### gitui79 v0.3.3 (2023年7月14日)

- 新規ブランチ作成のUIを変更した。
- 新しい差分をコミットできない場合がある問題を修正した。

### gitui79 v0.3.2 (2023年5月1日)

- px2style を更新した。

### gitui79 v0.3.1 (2023年4月22日)

- status画面でファイル毎の差分表示がされない不具合の修正。
- log画面で、「このバージョン適用前に戻る」機能を追加した。
- log画面で、コミット中のファイルの差分を表示するようになった。
- log画面で、「次の50件」をクリックして続きがない場合に起きるエラーを修正した。
- 古いバージョンの git環境で、削除されたファイルをコミットできない不具合を修正した。
- `options.lang` を追加した。
- スタイリングとUIの改善。

### gitui79 v0.3.0 (2022年6月5日)

- ファイルのステータス表示で、ソースの差分が見やすくなった。
- ダークモードへの対応を強化した。

### gitui79 v0.2.2 (2021年5月25日)

- リモートでブランチが削除されたことが反映されない問題を修正。

### gitui79 v0.2.1 (2021年4月28日)

- コミットがないときに、コミットログを表示しようとすると、画面のロードが完了しない不具合を修正した。
- ステータス画面とブランチ画面の表示前に `git fetch` を要求するようになった。
- その他の細かい修正。

### gitui79 v0.2.0 (2021年3月31日)

- コミット画面とステータス画面を統合した。
- ステータス画面で、コミットされていない変更内容を確認できるようになった。
- ステータス画面で、コミットされていない変更内容を取り消しできるようになった。
- コミットログ画面を追加した。
- オプション `committer` を追加した。
- プッシュ画面、プル画面、ブランチ画面を追加した。
- その他いくつかのUI改善と不具合の修正。

### gitui79 v0.1.0 (2019年8月15日)

- 初回リリース


## License

MIT License


## Author

- Tomoya Koyanagi <tomk79@gmail.com>
- website: <https://www.pxt.jp/>
- Twitter: @tomk79 <https://twitter.com/tomk79/>
