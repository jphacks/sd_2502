<template>
  <UCard
    :ui="{
      body: { padding: 'p-6' },
      ring: 'ring-1 ring-gray-800',
      background: 'bg-gray-900',
    }"
  >
    <div class="flex flex-col gap-4">
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-2">
          <UIcon :name="directionIcon" class="w-5 h-5" :class="directionColor" />
          <span class="text-xs font-medium text-gray-400">
            {{ direction === "in" ? "Received" : "Sent" }}
          </span>
        </div>

        <UBadge v-if="message" :color="statusBadgeColor" variant="subtle" size="xs">
          {{ statusLabel }}
        </UBadge>
      </div>

      <div v-if="message" class="min-h-[80px] flex items-center">
        <p class="text-2xl text-white break-words w-full">
          {{ message.text }}
        </p>
      </div>
      <div v-else class="min-h-[80px] flex items-center justify-center">
        <p class="text-gray-600 text-sm">No messages yet</p>
      </div>

      <div class="flex justify-end">
        <span class="text-xs text-gray-500">
          {{ timeString }}
        </span>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { Message } from "~/types/message";

const props = defineProps<{
  message?: Message;
  direction: "in" | "out";
}>();

const directionIcon = computed(() => {
  return props.direction === "in" ? "i-heroicons-arrow-down-circle" : "i-heroicons-arrow-up-circle";
});

const directionColor = computed(() => {
  return props.direction === "in" ? "text-blue-400" : "text-green-400";
});

const statusLabel = computed(() => {
  if (!props.message) return "";

  switch (props.message.status) {
    case "sending":
      return "Sending";
    case "sent":
      return "Sent";
    case "failed":
      return "Failed";
    case "ack":
      return "Ack";
    default:
      return "";
  }
});

const statusBadgeColor = computed(() => {
  if (!props.message) return "gray";

  switch (props.message.status) {
    case "sending":
      return "yellow";
    case "sent":
      return "blue";
    case "failed":
      return "red";
    case "ack":
      return "green";
    default:
      return "gray";
  }
});

const timeString = computed(() => {
  if (!props.message) return "--:--";

  const date = new Date(props.message.timestamp);
  return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
});
</script>
