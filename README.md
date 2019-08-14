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
    }
);
// console.log(remoteFinder);
gitUi79.init(function(){
    console.log('ready.');
});
</script>
```


## 更新履歴 - Change log

### gitui79 v0.1.1 (リリース日未定)

- `git status` 画面に、コミットログを表示するようになった。

### gitui79 v0.1.0 (2019年8月15日)

- 初回リリース


## License

MIT License


## Author

- Tomoya Koyanagi <tomk79@gmail.com>
- website: <https://www.pxt.jp/>
- Twitter: @tomk79 <https://twitter.com/tomk79/>
