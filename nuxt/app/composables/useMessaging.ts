import type { Message, DeviceState, SendStatus, ReactionType } from "~/types/message";
import { ref, computed, onMounted } from "vue";

export const useMessaging = () => {
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

  // 最新の受信メッセージ
  const latestIncoming = computed(() => {
    return messages.value.filter((m) => m.direction === "in").sort((a, b) => b.timestamp - a.timestamp)[0];
  });

  // 最新の送信メッセージ
  const latestOutgoing = computed(() => {
    return messages.value.filter((m) => m.direction === "out").sort((a, b) => b.timestamp - a.timestamp)[0];
  });

  // 送信中のメッセージ数（Queue）
  const queueCount = computed(() => {
    return messages.value.filter((m) => m.direction === "out" && m.status === "sending").length;
  });

  // メッセージ送信（楽観的UI）
  const sendMessage = async (text: string) => {
    const clientId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newMessage: Message = {
      id: clientId,
      clientId,
      text,
      direction: "out",
      status: "sending",
      timestamp: Date.now(),
    };

    messages.value.push(newMessage);
    deviceState.value.queueCount++;

    // 擬似送信処理（2-4秒後にランダムで成功/失敗）
    await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 2000));

    const success = Math.random() > 0.2; // 80%成功率
    const messageIndex = messages.value.findIndex((m) => m.clientId === clientId);

    if (messageIndex !== -1) {
      messages.value[messageIndex].status = success ? "sent" : "failed";
      deviceState.value.queueCount--;

      if (success) {
        toast.add({
          title: "Sent successfully",
          color: "green",
          icon: "i-heroicons-check-circle",
        });

        // さらに1-3秒後にackに変更
        setTimeout(
          () => {
            const idx = messages.value.findIndex((m) => m.clientId === clientId);
            if (idx !== -1) {
              messages.value[idx].status = "ack";
            }
          },
          1000 + Math.random() * 2000,
        );
      } else {
        toast.add({
          title: "Send failed",
          description: "Please try again",
          color: "red",
          icon: "i-heroicons-x-circle",
        });
      }
    }
  };

  // リアクション送信
  const sendReaction = async (reaction: ReactionType) => {
    const clientId = `react-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

    // 擬似送信（1-2秒）
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    const messageIndex = messages.value.findIndex((m) => m.clientId === clientId);
    if (messageIndex !== -1) {
      messages.value[messageIndex].status = "sent";
      deviceState.value.queueCount--;

      setTimeout(
        () => {
          const idx = messages.value.findIndex((m) => m.clientId === clientId);
          if (idx !== -1) {
            messages.value[idx].status = "ack";
          }
        },
        500 + Math.random() * 1000,
      );
    }
  };

  // 手動リフレッシュ
  const manualRefresh = async () => {
    deviceState.value.status = "syncing";

    // 擬似受信メッセージ生成
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    const responses = ["こんにちは！", "お疲れ様です", "了解しました", "ありがとうございます", "👍", "確認しました"];

    const incomingMessage: Message = {
      id: `msg-in-${Date.now()}`,
      text: responses[Math.floor(Math.random() * responses.length)],
      direction: "in",
      status: "ack",
      timestamp: Date.now(),
    };

    messages.value.push(incomingMessage);
    deviceState.value.lastSync = Date.now();
    deviceState.value.status = "online";

    toast.add({
      title: "Refreshed",
      color: "blue",
      icon: "i-heroicons-arrow-path",
    });
  };

  // Poll間隔切り替え
  const togglePollSpeed = () => {
    deviceState.value.pollMs = deviceState.value.pollMs === 3000 ? 10000 : 3000;
  };

  // 初期メッセージ
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
