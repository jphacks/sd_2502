<script setup lang="ts">
// メッセージング用の状態と操作を Composable から取得
const {
  messages,
  deviceState,
  latestIncoming,
  latestOutgoing,
  queueCount,
  sendMessage,
  sendReaction,
  connectSSE,
  togglePollSpeed,
} = useMessaging();

// 履歴モーダルの開閉状態
const isHistoryOpen = ref(false);

// 履歴を開く
const openHistory = () => {
  console.log("Opening history...");
  isHistoryOpen.value = true;
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
    <!-- ヘッダー（デバイス状態の表示と手動更新ボタン） -->
    <AppHeader :device-state="deviceState" @refresh="connectSSE" @show-history="openHistory" />

    <!-- メインコンテンツ：直近の入出力メッセージをカードで表示 -->
    <div class="flex-1 overflow-y-auto px-4 py-6">
      <div class="max-w-2xl mx-auto space-y-4">
        <!-- 直近の受信メッセージ -->
        <MessageCard :message="latestIncoming" direction="in" />

        <!-- 直近の送信メッセージ -->
        <MessageCard :message="latestOutgoing" direction="out" />
      </div>
    </div>

    <!-- アクションバー（キュー数、ポーリング間隔切替、リアクション送信） -->
    <ActionBar
      :queue-count="queueCount"
      :poll-ms="deviceState.pollMs"
      @reaction="sendReaction"
      @toggle-poll="togglePollSpeed"
    />

    <!-- メッセージ入力（送信トリガーで sendMessage を呼び出し） -->
    <MessageInput @send="sendMessage" />

    <!-- メッセージ履歴モーダル -->
    <!-- <MessageHistory v-model="isHistoryOpen" :messages="messages" /> -->
  </div>
</template>
