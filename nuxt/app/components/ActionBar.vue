<template>
  <div class="border-t border-gray-800 bg-gray-900 px-4 py-4">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <UButton
          v-for="reaction in reactions"
          :key="reaction"
          color="gray"
          variant="soft"
          size="lg"
          @click="$emit('reaction', reaction)"
        >
          <span class="text-xl">{{ reaction }}</span>
        </UButton>
      </div>

      <div class="flex items-center gap-3">
        <div v-if="queueCount > 0" class="flex items-center gap-1.5">
          <UIcon name="i-heroicons-queue-list" class="w-4 h-4 text-gray-400" />
          <span class="text-sm text-gray-400">{{ queueCount }}</span>
        </div>

        <UButton :color="pollSpeed === 'FAST' ? 'green' : 'gray'" variant="soft" size="xs" @click="$emit('togglePoll')">
          {{ pollSpeed }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReactionType } from "~/types/message";

const props = defineProps<{
  queueCount: number;
  pollMs: number;
}>();

defineEmits<{
  reaction: [reaction: ReactionType];
  togglePoll: [];
}>();

const reactions: ReactionType[] = ["👍", "❤️", "✨", "❗"];

const pollSpeed = computed(() => {
  return props.pollMs <= 3000 ? "FAST" : "STD";
});
</script>
