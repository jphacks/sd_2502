<template>
  <div
    class="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 sm:px-6 py-3 sm:py-4 pb-safe flex-1 flex flex-col"
  >
    <div class="flex items-start gap-2 sm:gap-3 flex-1">
      <div class="flex-1 flex flex-col min-h-0">
        <UTextarea
          v-model="messageText"
          placeholder="短いメッセージを入力!"
          :rows="1"
          :maxlength="50"
          :ui="{ root: 'relative flex-1', base: 'resize-none' }"
          @keydown.enter.prevent="handleSend"
        />
        <div class="flex justify-end mt-1">
          <span class="text-sm text-gray-600 dark:text-gray-500" :class="remainingColor"> {{ remaining }} / 50 </span>
        </div>
      </div>

      <!-- 送信ボタン(入力が空/上限超過のときは無効) -->
      <UButton
        icon="i-heroicons-paper-airplane"
        color="primary"
        size="lg"
        :disabled="!canSend"
        @click="handleSend"
        class="shrink-0"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// emits: 親へ送信テキストを通知
const emit = defineEmits<{
  send: [text: string];
}>();

// 入力テキスト
const messageText = ref("");

// 残り文字数（最大50）
const remaining = computed(() => 50 - messageText.value.length);

// 残り文字数に応じた警告色
const remainingColor = computed(() => {
  const len = messageText.value.length;
  if (len > 120) return "text-red-400";
  if (len > 100) return "text-yellow-400";
  return "text-gray-500";
});

// 送信可否: 空白のみ・上限超過は不可
const canSend = computed(() => {
  return messageText.value.trim().length > 0 && messageText.value.length <= 50;
});

// 送信処理: バリデーション通過時に emit して入力をクリア
const handleSend = () => {
  if (!canSend.value) return;

  emit("send", messageText.value.trim());
  messageText.value = "";
};
</script>
