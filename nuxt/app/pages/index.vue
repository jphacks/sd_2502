<script setup lang="ts">
const {
  deviceState,
  latestIncoming,
  latestOutgoing,
  queueCount,
  sendMessage,
  sendReaction,
  manualRefresh,
  togglePollSpeed,
} = useMessaging();
</script>

<template>
  <div class="min-h-screen bg-gray-950 flex flex-col">
    <!-- Header -->
    <AppHeader :device-state="deviceState" @refresh="manualRefresh" />

    <!-- Main Content -->
    <div class="flex-1 overflow-y-auto px-4 py-6">
      <div class="max-w-2xl mx-auto space-y-4">
        <!-- Latest Incoming Message Card -->
        <MessageCard :message="latestIncoming" direction="in" />

        <!-- Latest Outgoing Message Card -->
        <MessageCard :message="latestOutgoing" direction="out" />
      </div>
    </div>

    <!-- Action Bar -->
    <ActionBar
      :queue-count="queueCount"
      :poll-ms="deviceState.pollMs"
      @reaction="sendReaction"
      @toggle-poll="togglePollSpeed"
    />

    <!-- Message Input -->
    <MessageInput @send="sendMessage" />
  </div>
</template>
