import { createHooks } from "hookable";

/**
 * SSEを配信するためのHooks
 */
export const messageHooks = createHooks<{
  "message:new": (data: { statusCode: number; message: string; clientId?: string }) => void;
}>();
