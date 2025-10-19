import { messageHooks } from "../utils/hooks";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const storage = useStorage();

  if (!body || body.message === null || body.message === undefined) {
    return {
      statusCode: 400,
      message: "Invalid JSON body",
    };
  }

  const latestMessage = String(body.message);
  const clientId = body.clientId as string | undefined;

  await storage.setItem("latest-message", latestMessage);

  // SSEでメッセージを配信（clientIdも含める）
  await messageHooks.callHook("message:new", {
    statusCode: 200,
    message: latestMessage,
    clientId,
  });

  return {
    statusCode: 200,
    message: latestMessage,
  };
});
