export type SendStatus = "idle" | "sending" | "sent" | "failed" | "ack";

export type Message = {
  id: string;
  clientId?: string;
  text: string;
  direction: "out" | "in";
  status: SendStatus;
  timestamp: number;
};

export type DeviceState = {
  id: string;
  name: string;
  status: "online" | "syncing" | "offline";
  lastSync: number;
  pollMs: number;
  queueCount: number;
};

export type ReactionType = "👍" | "❤️" | "✨" | "❗";
