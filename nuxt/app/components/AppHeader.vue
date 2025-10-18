<template>
  <div
    class="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800 px-4 py-3"
  >
    <div class="flex items-center justify-between">
      <!-- 左側: デバイス名と状態バッジ -->
      <div class="flex items-center gap-3">
        <h1 class="text-lg font-semibold text-gray-900 dark:text-white">{{ deviceState.name }}</h1>
        <UBadge :color="statusColor" variant="subtle" size="sm">
          {{ statusLabel }}
        </UBadge>
      </div>

      <!-- 右側: テーマ切替 / 最終同期時刻 / 手動更新ボタン -->
      <div class="flex items-center gap-3">
        <UButton
          :icon="theme === 'dark' ? 'i-heroicons-moon' : 'i-heroicons-sun'"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="toggleTheme()"
          :aria-label="`テーマを${theme === 'dark' ? 'ライト' : 'ダーク'}モードに切り替え`"
        />
        <!-- 最終更新のラベル付き表示。ホバーでフル日時を表示 -->
        <span class="text-sm text-gray-500 dark:text-gray-400" :title="lastSyncFull">
          最終更新: {{ lastSyncTime }}
        </span>
        <UButton
          icon="i-heroicons-arrow-path"
          color="neutral"
          variant="ghost"
          size="sm"
          :loading="deviceState.status === 'syncing'"
          @click="onRefresh"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DeviceState } from "../../types/message";
const { theme, toggleTheme } = useTheme();

// props: 親から渡されるデバイス状態（名前/オンライン状態/最終同期など）
const props = defineProps<{
  deviceState: DeviceState;
}>();

// emits: 手動更新トリガー
const emit = defineEmits<{
  refresh: [];
}>();

// 状態に応じたバッジ色（UI の視認性向上）
const statusColor = computed((): "primary" | "secondary" | "success" | "info" | "warning" | "error" | "neutral" => {
  switch (props.deviceState.status) {
    case "online":
      return "success";
    case "syncing":
      return "warning";
    case "offline":
      return "error";
    default:
      return "neutral";
  }
});

// 状態表示の日本語ラベル
const statusLabel = computed(() => {
  switch (props.deviceState.status) {
    case "online":
      return "オンライン";
    case "syncing":
      return "同期中";
    case "offline":
      return "オフライン";
    default:
      return "不明";
  }
});

// 最終同期時刻を日本語ロケールで表示
const lastSyncTime = computed(() => {
  const date = new Date(props.deviceState.lastSync);
  return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
});

// ツールチップ用のフル日時（年月日 + 時分秒）
const lastSyncFull = computed(() => {
  const date = new Date(props.deviceState.lastSync);
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
});

// 更新ボタン押下時のハンドラ
const onRefresh = () => {
  emit("refresh");
};
</script>
