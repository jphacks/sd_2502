# 入力値検証テストガイド

## 🚀 クイックスタート

### 1. サーバーを起動
```bash
cd nuxt
npm run dev
```

### 2. 自動テストを実行
```bash
# 別のターミナルで
node test-api-validation.js
```

---

## 📋 テスト方法一覧

### **方法1: 自動テストスクリプト (推奨)**

最も簡単で確実な方法です。

```bash
node test-api-validation.js
```

**出力例:**
```
🧪 入力値検証テスト開始
📡 テスト対象: http://localhost:3000/api/message
📊 テストケース数: 23

✅ 正常: 通常メッセージ
✅ 正常: 50文字ちょうど
✅ 正常: 絵文字
...
✅ XSS: スクリプトタグ

============================================================
📊 テスト結果: 23/23 成功
✅ すべてのテストに合格しました!
```

---

### **方法2: ブラウザコンソール**

1. ブラウザで `http://localhost:3000` を開く
2. 開発者ツール (F12) → Console タブ
3. 以下をコピペして実行:

```javascript
// 正常系
await fetch('/api/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello' })
}).then(r => r.json()).then(console.log);

// 異常系: 空文字列
await fetch('/api/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: '' })
}).then(r => r.json()).then(console.log);

// XSS攻撃
await fetch('/api/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: '<script>alert(1)</script>' })
}).then(r => r.json()).then(console.log);
```

---

### **方法3: curl コマンド**

```bash
# 正常系
curl -X POST http://localhost:3000/api/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'

# 空文字列 (エラーになるはず)
curl -X POST http://localhost:3000/api/message \
  -H "Content-Type: application/json" \
  -d '{"message":""}'

# 51文字 (エラーになるはず)
curl -X POST http://localhost:3000/api/message \
  -H "Content-Type: application/json" \
  -d '{"message":"123456789012345678901234567890123456789012345678901"}'

# XSS攻撃 (エスケープされるはず)
curl -X POST http://localhost:3000/api/message \
  -H "Content-Type: application/json" \
  -d '{"message":"<script>alert(1)</script>"}'
```

---

### **方法4: ネットワークタブで確認**

1. ブラウザで開発者ツール (F12) → **Network** タブ
2. アプリでメッセージを送信
3. `message` リクエストをクリック
4. **Payload** タブ: 送信データを確認
5. **Response** タブ: レスポンスを確認

---

## ✅ 検証項目チェックリスト

### サーバーサイド (`message.post.ts`)

- [ ] **型チェック**: 数値・配列・オブジェクトを拒否
- [ ] **空文字列**: 空文字列を拒否
- [ ] **空白のみ**: 空白のみを拒否
- [ ] **長さ制限**: 51文字以上を拒否
- [ ] **XSSエスケープ**: `<`, `>`, `"`, `'`, `/` をエスケープ
- [ ] **clientId型**: 数値型のclientIdを拒否
- [ ] **clientId長さ**: 101文字以上のclientIdを拒否

### クライアントサイド (`MessageInput.vue`)

- [ ] **maxlength**: 50文字で入力制限
- [ ] **送信ボタン**: 空白のみで無効化
- [ ] **残り文字数**: リアルタイム表示

---

## 🔍 期待される動作

| 入力 | 期待結果 |
|------|---------|
| `"Hello"` | ✅ 200 OK |
| `""` | ❌ 400 "Message cannot be empty" |
| `"   "` | ❌ 400 "Message cannot be empty" |
| `"a" × 50` | ✅ 200 OK |
| `"a" × 51` | ❌ 400 "Message too long" |
| `12345` | ❌ 400 "Message must be a string" |
| `null` | ❌ 400 "Invalid JSON body" |
| `"<script>alert(1)</script>"` | ✅ 200 (エスケープ済み) |
| `{ message: "Test", clientId: 123 }` | ❌ 400 "Invalid clientId" |

---

## 🛠️ トラブルシューティング

### エラー: サーバーに接続できません

```bash
# サーバーが起動しているか確認
ps aux | grep nuxt

# ポート3000が使用中か確認
lsof -i :3000

# サーバーを起動
npm run dev
```

### テストが失敗する

1. **サーバーログを確認**: ターミナルのエラーメッセージを確認
2. **コードの変更を確認**: `message.post.ts` が正しく編集されているか
3. **サーバーを再起動**: `Ctrl+C` → `npm run dev`

---

## 📝 テストケース追加方法

`test-api-validation.js` に追加:

```javascript
{
  name: '✅ 新しいテスト',
  body: { message: 'テストメッセージ' },
  expectStatus: 200,
  expectMessage: 'テストメッセージ'
}
```

---

## 🔐 セキュリティテスト

XSSエスケープが正しく動作しているか確認:

```javascript
const xssPatterns = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  '<svg onload=alert(1)>',
  '"><script>alert(1)</script>',
  "javascript:alert(1)",
];

for (const pattern of xssPatterns) {
  const res = await fetch('/api/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: pattern })
  });
  const data = await res.json();
  
  console.log('入力:', pattern);
  console.log('出力:', data.message);
  console.log('安全:', !data.message.includes('<'));
  console.log('---');
}
```

**期待結果**: すべての `<` が `&lt;` にエスケープされている
