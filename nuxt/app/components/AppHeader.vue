<template>
  <div class="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 px-4 py-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h1 class="text-lg font-semibold text-white">{{ deviceState.name }}</h1>
        <UBadge :color="statusColor" variant="subtle" size="xs">
          {{ deviceState.status.toUpperCase() }}
        </UBadge>
      </div>

      <div class="flex items-center gap-3">
        <span class="text-xs text-gray-400">{{ lastSyncTime }}</span>
        <UButton
          icon="i-heroicons-arrow-path"
          color="gray"
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
import type { DeviceState } from "~/types/message";

const props = defineProps<{
  deviceState: DeviceState;
}>();

const emit = defineEmits<{
  refresh: [];
}>();

const statusColor = computed(() => {
  switch (props.deviceState.status) {
    case "online":
      return "green";
    case "syncing":
      return "yellow";
    case "offline":
      return "red";
    default:
      return "gray";
  }
});

const lastSyncTime = computed(() => {
  const date = new Date(props.deviceState.lastSync);
  return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
});

const onRefresh = () => {
  emit("refresh");
};
</script>
