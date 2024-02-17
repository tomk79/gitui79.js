# gitui79.js

## Usage

```html
<div id="gitui79"></div>

<script>
var gitUi79 = new GitUi79(
    document.getElementById('gitui79'),
    function(cmdAry, callback){
        // サーバーでgitコマンドを実行するAPIを用意してください。
        // callback には、 gitコマンドが出力した文字列を返してください。
        var stdout = '';
        $.ajax({
            url: '/path/to/endpoint',
            data: cmdAry,
            success: function(data){
                stdout += data;
            },
            error: function(data){
                stdout += data; // エラー出力も stdout に混ぜて送る
            },
            complete: function(){
                callback(0, stdout);
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
// console.log(remoteFinder);
gitUi79.init(function(){
    console.log('ready.');
});
</script>
```


## 更新履歴 - Change log

### gitui79 v0.3.5 (リリース日未定)

- 差分表示のスタイリングに関する不具合を修正。

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
