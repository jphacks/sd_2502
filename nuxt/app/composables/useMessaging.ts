import type { Message, DeviceState, ReactionType, MessageApiResponse } from "../../types/message";
import { ref, computed, onMounted } from "vue";

export const useMessaging = () => {
  // ===== 状態（State） =====
  const messages = ref<Message[]>([]);
  const deviceState = ref<DeviceState>({
    id: "device-1",
    name: "My Device",
    status: "online",
    lastSync: Date.now(),
    pollMs: 3000,
    queueCount: 0,
  });

  const toast = useToast();

  // ===== 派生値（Derived） =====
  // 最新の受信メッセージ
  const latestIncoming = computed(() => {
    return messages.value
      .filter((m: Message) => m.direction === "in")
      .sort((a: Message, b: Message) => b.timestamp - a.timestamp)[0];
  });

  // 最新の送信メッセージ
  const latestOutgoing = computed(() => {
    return messages.value
      .filter((m: Message) => m.direction === "out")
      .sort((a: Message, b: Message) => b.timestamp - a.timestamp)[0];
  });

  // 送信中のメッセージ数（Queue）
  const queueCount = computed(() => {
    return messages.value.filter((m: Message) => m.direction === "out" && m.status === "sending").length;
  });

  // ===== 操作（Actions） =====
  // メッセージ送信（楽観的UI + API連携）
  const sendMessage = async (text: string) => {
    const clientId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newMessage: Message = {
      id: clientId,
      clientId,
      text,
      direction: "out",
      status: "sending",
      timestamp: Date.now(),
    };

    // 楽観的UI: 即座にメッセージを追加
    messages.value.push(newMessage);
    deviceState.value.queueCount++;

    try {
      // API呼び出し
      await $fetch<MessageApiResponse>("/api/message", {
        method: "POST",
        body: { message: text },
      });

      // 成功時の処理
      const messageIndex = messages.value.findIndex((m: Message) => m.clientId === clientId);
      if (messageIndex !== -1) {
        const msg = messages.value[messageIndex];
        if (msg) msg.status = "sent";
        deviceState.value.queueCount--;

        toast.add({
          title: "Sent successfully",
          color: "success",
          icon: "i-heroicons-check-circle",
        });

        setTimeout(() => {
          const idx = messages.value.findIndex((m: Message) => m.clientId === clientId);
          if (idx !== -1) {
            const m2 = messages.value[idx];
            if (m2) m2.status = "ack";
          }
        }, 1000);
      }
    } catch (error) {
      // 失敗時の処理
      const messageIndex = messages.value.findIndex((m: Message) => m.clientId === clientId);
      if (messageIndex !== -1) {
        const msg = messages.value[messageIndex];
        if (msg) msg.status = "failed";
        deviceState.value.queueCount--;

        toast.add({
          title: "Send failed",
          description: "Please try again",
          color: "error",
          icon: "i-heroicons-x-circle",
        });
      }
    }
  };

  // リアクション送信（アイコン文字をテキストとして送る）
  const sendReaction = async (reaction: ReactionType) => {
    const clientId = `react-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newMessage: Message = {
      id: clientId,
      clientId,
      text: reaction,
      direction: "out",
      status: "sending",
      timestamp: Date.now(),
    };

    messages.value.push(newMessage);
    deviceState.value.queueCount++;

    try {
      // API呼び出し
      await $fetch<MessageApiResponse>("/api/message", {
        method: "POST",
        body: { message: reaction },
      });

      const messageIndex = messages.value.findIndex((m: Message) => m.clientId === clientId);
      if (messageIndex !== -1) {
        const msg = messages.value[messageIndex];
        if (msg) msg.status = "sent";
        deviceState.value.queueCount--;

        setTimeout(() => {
          const idx = messages.value.findIndex((m: Message) => m.clientId === clientId);
          if (idx !== -1) {
            const m2 = messages.value[idx];
            if (m2) m2.status = "ack";
          }
        }, 1000);
      }
    } catch (error) {
      // 失敗時の処理
      const messageIndex = messages.value.findIndex((m: Message) => m.clientId === clientId);
      if (messageIndex !== -1) {
        const msg = messages.value[messageIndex];
        if (msg) msg.status = "failed";
        deviceState.value.queueCount--;

        toast.add({
          title: "Send failed",
          description: "Please try again",
          color: "error",
          icon: "i-heroicons-x-circle",
        });
      }
    }
  };

  // 手動リフレッシュ（APIからメッセージを取得）
  const manualRefresh = async () => {
    deviceState.value.status = "syncing";

    try {
      // API呼び出し
      const response = await $fetch<MessageApiResponse>("/api/message", {
        method: "GET",
      });

      // メッセージがあれば受信メッセージとして追加
      if (response.message) {
        const incomingMessage: Message = {
          id: `msg-in-${Date.now()}`,
          text: response.message,
          direction: "in",
          status: "ack",
          timestamp: Date.now(),
        };

        messages.value.push(incomingMessage);
      }

      deviceState.value.lastSync = Date.now();
      deviceState.value.status = "online";

      toast.add({
        title: "Refreshed",
        color: "info",
        icon: "i-heroicons-arrow-path",
      });
    } catch (error) {
      deviceState.value.status = "offline";

      toast.add({
        title: "Refresh failed",
        description: "Could not fetch messages",
        color: "error",
        icon: "i-heroicons-x-circle",
      });
    }
  };

  // Poll 間隔切り替え（3秒⇄10秒）
  const togglePollSpeed = () => {
    deviceState.value.pollMs = deviceState.value.pollMs === 3000 ? 10000 : 3000;
  };

  // ===== 初期化（Init） =====
  // 初期メッセージ（サンプルデータ）
  onMounted(() => {
    messages.value = [
      {
        id: "init-1",
        text: "こんにちは！接続しました",
        direction: "in",
        status: "ack",
        timestamp: Date.now() - 60000,
      },
      {
        id: "init-2",
        text: "よろしくお願いします",
        direction: "out",
        status: "ack",
        timestamp: Date.now() - 30000,
      },
    ];
  });

  // ===== 返り値（Public API） =====
  return {
    messages,
    deviceState,
    latestIncoming,
    latestOutgoing,
    queueCount,
    sendMessage,
    sendReaction,
    manualRefresh,
    togglePollSpeed,
  };
};
