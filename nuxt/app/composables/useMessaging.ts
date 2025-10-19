import type { Message, DeviceState, ReactionType, MessageApiResponse } from "../../types/message";
import { ref, computed, onMounted, onUnmounted } from "vue";

export const useMessaging = () => {
  // 状態
  const messages = ref<Message[]>([]);
  const deviceState = ref<DeviceState>({
    id: "device-1",
    name: "Re:ポケベル",
    status: "online",
    lastSync: Date.now(),
    pollMs: 3000,
    queueCount: 0,
  });

  const toast = useToast();

  // SSE接続の管理
  let eventSource: EventSource | null = null;

  // 派生値
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

  // 操作
  // メッセージ送信
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
        body: { message: text, clientId },
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
        body: { message: reaction, clientId },
      });

      const messageIndex = messages.value.findIndex((m: Message) => m.clientId === clientId);
      if (messageIndex !== -1) {
        const msg = messages.value[messageIndex];
        if (msg) msg.status = "sent";
        deviceState.value.queueCount--;
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

  // Poll 間隔切り替え（3秒⇄10秒）
  const togglePollSpeed = () => {
    deviceState.value.pollMs = deviceState.value.pollMs === 3000 ? 10000 : 3000;
  };

  // ===== SSE接続（Real-time） =====
  const connectSSE = () => {
    if (eventSource) {
      return;
    }

    eventSource = new EventSource("/api/sse");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as MessageApiResponse & { clientId?: string };

        if (data.statusCode === 200 && data.message) {
          // clientIdがある場合、自分が送ったメッセージの可能性がある
          if (data.clientId) {
            const existingIndex = messages.value.findIndex((m: Message) => m.clientId === data.clientId);

            if (existingIndex !== -1) {
              // 自分が送ったメッセージ → statusをackに更新
              const msg = messages.value[existingIndex];
              if (msg) msg.status = "ack";
              return; // 新規追加はしない
            }
          }

          // clientIdがないか、既存メッセージに見つからない場合 → 新着メッセージとして追加
          const incomingMessage: Message = {
            id: `msg-in-${Date.now()}`,
            text: data.message,
            direction: "in",
            status: "ack",
            timestamp: Date.now(),
          };

          messages.value.push(incomingMessage);

          toast.add({
            title: "New message",
            description: data.message,
            color: "info",
            icon: "i-heroicons-chat-bubble-left",
          });
        }
      } catch (error) {
        console.error("SSE message parse error:", error);
      }
    };

    eventSource.onerror = () => {
      console.error("SSE connection error");
      deviceState.value.status = "offline";

      // 再接続の試行
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }

      setTimeout(() => {
        connectSSE();
      }, 5000);
    };

    eventSource.onopen = () => {
      deviceState.value.status = "online";
    };
  };

  const disconnectSSE = () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };

  // ===== 初期化（Init） =====
  onMounted(() => {
    connectSSE();
  });

  onUnmounted(() => {
    disconnectSSE();
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
    togglePollSpeed,
    connectSSE,
  };
};
