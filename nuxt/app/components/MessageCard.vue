<template>
  <UCard
    :ui="{
      root: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800',
      body: 'p-6',
    }"
  >
    <!-- メッセージカード：方向・状態・本文・時刻を表示 -->
    <div class="flex flex-col gap-4">
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-2">
          <UIcon :name="directionIcon" class="w-5 h-5" :class="directionColor" />
          <span class="text-base font-medium text-gray-600 dark:text-gray-400">
            {{ direction === "in" ? "受信" : "送信" }}
          </span>
        </div>
        <UBadge v-if="message" :color="statusBadgeColor" variant="subtle" size="sm">
          {{ statusLabel }}
        </UBadge>
      </div>

      <!-- 本文（メッセージが無い場合はプレースホルダー） -->
      <div v-if="message" class="min-h-[80px] flex items-center">
        <p class="text-2xl text-gray-900 dark:text-white break-words w-full">
          {{ parsedText }}
        </p>
      </div>
      <div v-else class="min-h-[80px] flex items-center justify-center">
        <p class="text-gray-500 dark:text-gray-600 text-sm">まだメッセージがありません</p>
      </div>

      <div class="flex justify-end">
        <span class="text-sm text-gray-500 dark:text-gray-400">
          {{ timeString }}
        </span>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { Message } from "../../types/message";

// props: 表示対象メッセージ、方向（受信/送信）
const props = defineProps<{
  message?: Message;
  direction: "in" | "out";
}>();

// 方向に応じたアイコン
const directionIcon = computed(() => {
  return props.direction === "in" ? "i-heroicons-arrow-down-circle" : "i-heroicons-arrow-up-circle";
});

// 方向に応じた色
const directionColor = computed(() => {
  return props.direction === "in" ? "text-blue-400" : "text-green-400";
});

// ステータス表示用のラベル
const statusLabel = computed(() => {
  if (!props.message) return "";

  switch (props.message.status) {
    case "sending":
      return "送信中";
    case "sent":
      return "送信済み";
    case "failed":
      return "送信失敗";
    case "ack":
      return "送信完了";
    default:
      return "";
  }
});

// ステータスに応じたバッジ色
const statusBadgeColor = computed(
  (): "primary" | "secondary" | "success" | "info" | "warning" | "error" | "neutral" => {
    if (!props.message) return "neutral";

    switch (props.message.status) {
      case "sending":
        return "warning";
      case "sent":
        return "info";
      case "failed":
        return "error";
      case "ack":
        return "success";
      default:
        return "neutral";
    }
  },
);

// メッセージ本文の絵文字パース
const parsedText = computed(() => {
  if (!props.message?.text) return "";

  // 'stay home' を 'いま家にいるよ' に置換
  return props.message.text
    .replace(/\bstay home\b/gi, "いま家にいるよ");
});

// タイムスタンプの人間可読表示
const timeString = computed(() => {
  if (!props.message) return "--:--";

  const date = new Date(props.message.timestamp);
  return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
});
</script>
