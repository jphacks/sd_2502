<template>
  <div class="border-t border-gray-800 bg-gray-900 px-4 py-4">
    <div class="flex items-end gap-2">
      <div class="flex-1">
        <UTextarea
          v-model="messageText"
          placeholder="Type a message..."
          :rows="1"
          :maxlength="140"
          autoresize
          :ui="{
            wrapper: 'relative',
            base: 'resize-none',
          }"
          @keydown.enter.prevent="handleSend"
        />
        <div class="flex justify-end mt-1">
          <span class="text-xs" :class="remainingColor"> {{ remaining }} / 140 </span>
        </div>
      </div>

      <UButton icon="i-heroicons-paper-airplane" color="primary" size="lg" :disabled="!canSend" @click="handleSend" />
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  send: [text: string];
}>();

const messageText = ref("");

const remaining = computed(() => 140 - messageText.value.length);

const remainingColor = computed(() => {
  const len = messageText.value.length;
  if (len > 120) return "text-red-400";
  if (len > 100) return "text-yellow-400";
  return "text-gray-500";
});

const canSend = computed(() => {
  return messageText.value.trim().length > 0 && messageText.value.length <= 140;
});

const handleSend = () => {
  if (!canSend.value) return;

  emit("send", messageText.value.trim());
  messageText.value = "";
};
</script>
