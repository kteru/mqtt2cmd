mqtt2cmd
========

概要
----

- 購読したトピックのメッセージによって対応するコマンドを実行する

使い方
------

- 配置とモジュールインストール

```
$ cd /path/to/somewhere
$ git clone https://github.com/kteru/mqtt2cmd.git .
$ npm install
```

- コンフィグ作成

```
$ cp -a config.json.sample config.json
$ vi config.json
```

- 実行

```
$ node app.js
```

Licence
-------

[MIT License](LICENSE)

Author
------

[teru](https://github.com/kteru)
