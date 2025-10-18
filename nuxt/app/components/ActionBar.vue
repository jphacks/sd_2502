<template>
  <div class="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-4">
    <div class="flex items-center justify-between mb-4">
      <!-- リアクション送信用ボタン群 -->
      <div class="flex items-center gap-2">
        <UButton
          v-for="reaction in reactions"
          :key="reaction"
          color="neutral"
          variant="soft"
          size="lg"
          @click="$emit('reaction', reaction)"
        >
          <span class="text-xl">{{ reaction }}</span>
        </UButton>
      </div>

      <div class="flex items-center gap-3">
        <!-- 送信キューの件数表示（0件のときは非表示） -->
        <div v-if="queueCount > 0" class="flex items-center gap-1.5">
          <UIcon name="i-heroicons-queue-list" class="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span class="text-sm text-gray-600 dark:text-gray-400">{{ queueCount }}</span>
        </div>

        <!-- ポーリング速度の切替（FAST/STD）
        <UButton
          :color="pollSpeed === 'FAST' ? 'success' : 'neutral'"
          variant="soft"
          size="xs"
          @click="$emit('togglePoll')"
        >
          {{ pollSpeed }}
        </UButton> -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReactionType } from "../../types/message";

// 入出力
// props: キュー件数とポーリング間隔(ms)
const props = defineProps<{
  queueCount: number;
  pollMs: number;
}>();

// emits: リアクション送信、ポーリング切替
defineEmits<{
  reaction: [reaction: ReactionType];
  togglePoll: [];
}>();

// 表示するリアクションの候補
const reactions: ReactionType[] = ["👍", "❤️", "✨", "❗"];

// ポーリング間隔から表示ラベルを算出
// const pollSpeed = computed(() => {
//   return props.pollMs <= 3000 ? "FAST" : "STD";
// });
</script>
