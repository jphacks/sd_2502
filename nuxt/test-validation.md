# 入力値検証テストガイド

## 1. ブラウザコンソールでのテスト

開発者ツール (F12) → Console タブで以下を実行:

### ✅ 正常系テスト

```javascript
// 正常なメッセージ
fetch('/api/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello' })
}).then(r => r.json()).then(console.log);
// 期待: { statusCode: 200, message: "Hello" }

// clientId付き
fetch('/api/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Test', clientId: 'test-123' })
}).then(r => r.json()).then(console.log);
// 期待: { statusCode: 200, message: "Test" }
```

### ❌ 異常系テスト

```javascript
// 1. 空文字列
fetch('/api/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: '' })
}).then(r => r.json()).then(console.log);
// 期待: { statusCode: 400, message: "Message cannot be empty" }

// 2. 空白のみ
fetch('/api/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: '   ' })
}).then(r => r.json()).then(console.log);
// 期待: { statusCode: 400, message: "Message cannot be empty" }

// 3. 51文字以上
fetch('/api/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'a'.repeat(51) })
}).then(r => r.json()).then(console.log);
// 期待: { statusCode: 400, message: "Message too long (max 50 characters)" }

// 4. 型エラー (数値)
fetch('/api/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 12345 })
}).then(r => r.json()).then(console.log);
// 期待: { statusCode: 400, message: "Message must be a string" }

// 5. 型エラー (null)
fetch('/api/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: null })
}).then(r => r.json()).then(console.log);
// 期待: { statusCode: 400, message: "Invalid JSON body" }

// 6. XSS攻撃パターン
fetch('/api/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: '<script>alert("XSS")</script>' })
}).then(r => r.json()).then(console.log);
// 期待: { statusCode: 200, message: "&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;" }

// 7. 不正なclientId (数値)
fetch('/api/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Test', clientId: 12345 })
}).then(r => r.json()).then(console.log);
// 期待: { statusCode: 400, message: "Invalid clientId" }

// 8. 長すぎるclientId (101文字)
fetch('/api/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Test', clientId: 'a'.repeat(101) })
}).then(r => r.json()).then(console.log);
// 期待: { statusCode: 400, message: "Invalid clientId" }
```

---

## 2. curlコマンドでのテスト

ターミナルで実行:

```bash
# 正常系
curl -X POST http://localhost:3000/api/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'

# 空文字列
curl -X POST http://localhost:3000/api/message \
  -H "Content-Type: application/json" \
  -d '{"message":""}'

# 51文字
curl -X POST http://localhost:3000/api/message \
  -H "Content-Type: application/json" \
  -d '{"message":"123456789012345678901234567890123456789012345678901"}'

# XSS攻撃
curl -X POST http://localhost:3000/api/message \
  -H "Content-Type: application/json" \
  -d '{"message":"<script>alert(1)</script>"}'

# 型エラー
curl -X POST http://localhost:3000/api/message \
  -H "Content-Type: application/json" \
  -d '{"message":12345}'
```

---

## 3. 自動テストスクリプト

以下のスクリプトを作成して実行:

```javascript
// test-api.js
const BASE_URL = 'http://localhost:3000';

const tests = [
  { name: '正常: 通常メッセージ', body: { message: 'Hello' }, expect: 200 },
  { name: '正常: 50文字ちょうど', body: { message: 'a'.repeat(50) }, expect: 200 },
  { name: '正常: clientId付き', body: { message: 'Test', clientId: 'test-123' }, expect: 200 },
  { name: '異常: 空文字列', body: { message: '' }, expect: 400 },
  { name: '異常: 空白のみ', body: { message: '   ' }, expect: 400 },
  { name: '異常: 51文字', body: { message: 'a'.repeat(51) }, expect: 400 },
  { name: '異常: 数値型', body: { message: 12345 }, expect: 400 },
  { name: '異常: null', body: { message: null }, expect: 400 },
  { name: '異常: undefined', body: {}, expect: 400 },
  { name: '異常: 不正なclientId型', body: { message: 'Test', clientId: 123 }, expect: 400 },
  { name: '異常: 長すぎるclientId', body: { message: 'Test', clientId: 'a'.repeat(101) }, expect: 400 },
  { name: 'XSS: スクリプトタグ', body: { message: '<script>alert(1)</script>' }, expect: 200 },
];

async function runTests() {
  console.log('🧪 入力値検証テスト開始\n');
  
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const response = await fetch(`${BASE_URL}/api/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.body),
      });
      
      const data = await response.json();
      const success = response.status === test.expect;
      
      if (success) {
        console.log(`✅ ${test.name}`);
        passed++;
      } else {
        console.log(`❌ ${test.name}`);
        console.log(`   期待: ${test.expect}, 実際: ${response.status}`);
        console.log(`   レスポンス:`, data);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} - エラー: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 結果: ${passed}/${tests.length} 成功, ${failed} 失敗`);
}

runTests();
```

実行方法:
```bash
node test-api.js
```

---

## 4. ネットワークタブでの確認

1. ブラウザで開発者ツール (F12) → Network タブ
2. アプリでメッセージを送信
3. `message` リクエストをクリック
4. **Payload** タブで送信データを確認
5. **Response** タブでレスポンスを確認

---

## 5. チェックリスト

### サーバーサイド検証
- [ ] 空文字列を拒否
- [ ] 空白のみを拒否
- [ ] 51文字以上を拒否
- [ ] 数値型を拒否
- [ ] null/undefinedを拒否
- [ ] XSS文字をエスケープ
- [ ] clientIdの型チェック
- [ ] clientIdの長さ制限

### クライアントサイド検証
- [ ] 50文字制限 (maxlength)
- [ ] 空白のみで送信ボタン無効化
- [ ] 残り文字数表示

### Arduino側
- [ ] JSONが正しく構築される
- [ ] 特殊文字が含まれても動作する

---

## 6. セキュリティ確認

```javascript
// XSSエスケープの確認
const xssPatterns = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  'javascript:alert(1)',
  '<svg onload=alert(1)>',
  '"><script>alert(1)</script>',
];

for (const pattern of xssPatterns) {
  fetch('/api/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: pattern })
  }).then(r => r.json()).then(data => {
    console.log('入力:', pattern);
    console.log('出力:', data.message);
    console.log('エスケープ済み:', !data.message.includes('<'));
    console.log('---');
  });
}
```

期待結果: すべての `<` が `&lt;` にエスケープされている
