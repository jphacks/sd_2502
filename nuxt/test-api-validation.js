/**
 * 入力値検証の自動テストスクリプト
 * 
 * 使い方:
 * 1. Nuxtサーバーを起動: npm run dev
 * 2. 別ターミナルで実行: node test-api-validation.js
 */

const BASE_URL = 'http://localhost:3000';

const tests = [
  // ✅ 正常系
  { 
    name: '✅ 正常: 通常メッセージ', 
    body: { message: 'Hello' }, 
    expectStatus: 200,
    expectMessage: 'Hello'
  },
  { 
    name: '✅ 正常: 50文字ちょうど', 
    body: { message: 'a'.repeat(50) }, 
    expectStatus: 200 
  },
  { 
    name: '✅ 正常: 絵文字', 
    body: { message: '👍❤️✨' }, 
    expectStatus: 200 
  },
  { 
    name: '✅ 正常: clientId付き', 
    body: { message: 'Test', clientId: 'test-123' }, 
    expectStatus: 200 
  },
  { 
    name: '✅ 正常: 前後の空白は削除される', 
    body: { message: '  Hello  ' }, 
    expectStatus: 200,
    expectMessage: 'Hello'
  },

  // ❌ 異常系: メッセージ検証
  { 
    name: '❌ 異常: 空文字列', 
    body: { message: '' }, 
    expectStatus: 400,
    expectError: 'Message cannot be empty'
  },
  { 
    name: '❌ 異常: 空白のみ', 
    body: { message: '   ' }, 
    expectStatus: 400,
    expectError: 'Message cannot be empty'
  },
  { 
    name: '❌ 異常: 51文字', 
    body: { message: 'a'.repeat(51) }, 
    expectStatus: 400,
    expectError: 'Message too long'
  },
  { 
    name: '❌ 異常: 数値型', 
    body: { message: 12345 }, 
    expectStatus: 400,
    expectError: 'Message must be a string'
  },
  { 
    name: '❌ 異常: null', 
    body: { message: null }, 
    expectStatus: 400,
    expectError: 'Invalid JSON body'
  },
  { 
    name: '❌ 異常: undefined', 
    body: {}, 
    expectStatus: 400,
    expectError: 'Invalid JSON body'
  },
  { 
    name: '❌ 異常: 配列型', 
    body: { message: ['test'] }, 
    expectStatus: 400,
    expectError: 'Message must be a string'
  },
  { 
    name: '❌ 異常: オブジェクト型', 
    body: { message: { text: 'test' } }, 
    expectStatus: 400,
    expectError: 'Message must be a string'
  },

  // ❌ 異常系: clientId検証
  { 
    name: '❌ 異常: 不正なclientId型(数値)', 
    body: { message: 'Test', clientId: 123 }, 
    expectStatus: 400,
    expectError: 'Invalid clientId'
  },
  { 
    name: '❌ 異常: 長すぎるclientId(101文字)', 
    body: { message: 'Test', clientId: 'a'.repeat(101) }, 
    expectStatus: 400,
    expectError: 'Invalid clientId'
  },

  // 🔒 セキュリティ: XSS対策
  { 
    name: '🔒 XSS: スクリプトタグ', 
    body: { message: '<script>alert("XSS")</script>' }, 
    expectStatus: 200,
    checkEscaped: true
  },
  { 
    name: '🔒 XSS: imgタグ', 
    body: { message: '<img src=x onerror=alert(1)>' }, 
    expectStatus: 200,
    checkEscaped: true
  },
  { 
    name: '🔒 XSS: svgタグ', 
    body: { message: '<svg onload=alert(1)>' }, 
    expectStatus: 200,
    checkEscaped: true
  },
  { 
    name: '🔒 XSS: ダブルクォート', 
    body: { message: 'test"test' }, 
    expectStatus: 200,
    checkEscaped: true
  },
  { 
    name: '🔒 XSS: シングルクォート', 
    body: { message: "test'test" }, 
    expectStatus: 200,
    checkEscaped: true
  },
];

async function runTests() {
  console.log('🧪 入力値検証テスト開始');
  console.log(`📡 テスト対象: ${BASE_URL}/api/message`);
  console.log(`📊 テストケース数: ${tests.length}\n`);
  
  let passed = 0;
  let failed = 0;
  const failedTests = [];

  for (const test of tests) {
    try {
      const response = await fetch(`${BASE_URL}/api/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.body),
      });
      
      const data = await response.json();
      let success = response.status === test.expectStatus;
      
      // ステータスコードチェック
      if (!success) {
        console.log(`❌ ${test.name}`);
        console.log(`   期待ステータス: ${test.expectStatus}, 実際: ${response.status}`);
        console.log(`   レスポンス:`, data);
        failed++;
        failedTests.push(test.name);
        continue;
      }

      // エラーメッセージチェック
      if (test.expectError && !data.message.includes(test.expectError)) {
        console.log(`❌ ${test.name}`);
        console.log(`   期待エラー: "${test.expectError}"`);
        console.log(`   実際のメッセージ: "${data.message}"`);
        failed++;
        failedTests.push(test.name);
        continue;
      }

      // メッセージ内容チェック
      if (test.expectMessage && data.message !== test.expectMessage) {
        console.log(`❌ ${test.name}`);
        console.log(`   期待メッセージ: "${test.expectMessage}"`);
        console.log(`   実際のメッセージ: "${data.message}"`);
        failed++;
        failedTests.push(test.name);
        continue;
      }

      // XSSエスケープチェック
      if (test.checkEscaped) {
        const hasRawTags = data.message.includes('<') || data.message.includes('>');
        if (hasRawTags) {
          console.log(`❌ ${test.name}`);
          console.log(`   エスケープされていません!`);
          console.log(`   入力: "${test.body.message}"`);
          console.log(`   出力: "${data.message}"`);
          failed++;
          failedTests.push(test.name);
          continue;
        }
      }

      console.log(`✅ ${test.name}`);
      passed++;
      
    } catch (error) {
      console.log(`❌ ${test.name}`);
      console.log(`   エラー: ${error.message}`);
      failed++;
      failedTests.push(test.name);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 テスト結果: ${passed}/${tests.length} 成功`);
  
  if (failed > 0) {
    console.log(`❌ 失敗: ${failed}件`);
    console.log('\n失敗したテスト:');
    failedTests.forEach(name => console.log(`  - ${name}`));
    process.exit(1);
  } else {
    console.log('✅ すべてのテストに合格しました!');
    process.exit(0);
  }
}

// サーバー接続チェック
async function checkServer() {
  try {
    const response = await fetch(BASE_URL);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// メイン実行
(async () => {
  console.log('🔍 サーバー接続確認中...\n');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.error('❌ エラー: サーバーに接続できません');
    console.error(`   ${BASE_URL} が起動しているか確認してください`);
    console.error('   起動コマンド: npm run dev');
    process.exit(1);
  }
  
  await runTests();
})();
