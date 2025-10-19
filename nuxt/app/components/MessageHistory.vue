<template>
  <USlideover v-model="isOpen" :ui="{ width: 'max-w-md' }">
    <UCard
      :ui="{
        ring: '',
        divide: 'divide-y divide-gray-100 dark:divide-gray-800',
        body: { base: 'flex-1 overflow-y-auto', padding: '' },
      }"
      class="flex flex-col h-full"
    >
      <!-- ヘッダー -->
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">メッセージ履歴</h3>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark-20-solid"
            class="-my-1"
            @click="closeModal"
          />
        </div>
      </template>

      <!-- メッセージリスト -->
      <div class="flex-1 overflow-y-auto px-4 py-4">
        <div v-if="messages.length === 0" class="text-center py-12">
          <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p class="text-gray-500 dark:text-gray-400">メッセージがありません</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="message in sortedMessages"
            :key="message.id"
            class="flex"
            :class="message.direction === 'out' ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[75%] rounded-lg px-4 py-3 shadow-sm"
              :class="
                message.direction === 'out'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
              "
            >
              <!-- メッセージ本文 -->
              <p class="text-sm break-words whitespace-pre-wrap">
                {{ parsedText(message.text) }}
              </p>

              <!-- タイムスタンプとステータス -->
              <div class="flex items-center gap-2 mt-2">
                <span
                  class="text-xs"
                  :class="message.direction === 'out' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'"
                >
                  {{ formatTime(message.timestamp) }}
                </span>

                <!-- 送信メッセージの場合はステータスアイコン表示 -->
                <UIcon
                  v-if="message.direction === 'out'"
                  :name="getStatusIcon(message.status)"
                  class="w-3 h-3"
                  :class="message.direction === 'out' ? 'text-blue-100' : 'text-gray-500'"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- フッター（統計情報） -->
      <template #footer>
        <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>合計: {{ messages.length }}件</span>
          <div class="flex gap-4">
            <span>受信: {{ incomingCount }}件</span>
            <span>送信: {{ outgoingCount }}件</span>
          </div>
        </div>
      </template>
    </UCard>
  </USlideover>
</template>

<script setup lang="ts">
import type { Message } from "../../types/message";

// props
const props = defineProps<{
  messages: Message[];
  modelValue: boolean;
}>();

// emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

// モーダルの開閉状態
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

// モーダルを閉じる
const closeModal = () => {
  emit('update:modelValue', false);
};

// メッセージを時系列順にソート（古い順）
const sortedMessages = computed(() => {
  return [...props.messages].sort((a, b) => a.timestamp - b.timestamp);
});

// 受信メッセージ数
const incomingCount = computed(() => {
  return props.messages.filter((m) => m.direction === "in").length;
});

// 送信メッセージ数
const outgoingCount = computed(() => {
  return props.messages.filter((m) => m.direction === "out").length;
});

// テキストの絵文字パース
const parsedText = (text: string) => {
  return text.replace(/\bgood\b/gi, "👍").replace(/\bbad\b/gi, "🙂‍↔️");
};

// タイムスタンプのフォーマット
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  } else {
    return date.toLocaleString("ja-JP", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
};

// ステータスに応じたアイコン
const getStatusIcon = (status: Message["status"]) => {
  switch (status) {
    case "sending":
      return "i-heroicons-clock";
    case "sent":
      return "i-heroicons-check";
    case "ack":
      return "i-heroicons-check-circle";
    case "failed":
      return "i-heroicons-x-circle";
    default:
      return "i-heroicons-question-mark-circle";
  }
};
</script>
