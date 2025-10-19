## API概要

- 以下のURLに`POST`か`GET`をすることでメッセージの送受信が出来ます

```text
# メッセージをサーバーへ送信
POST: https://sd-2502.vercel.app/api/message

body内で {message: "送信したいテキスト"} をつける

# メッセージをサーバから取得
GET: https://sd-2502.vercel.app/api/message
```
