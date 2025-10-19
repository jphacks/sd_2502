import { messageHooks } from "../utils/hooks";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const storage = useStorage();

  // 入力値の基本検証
  if (!body || body.message === null || body.message === undefined) {
    setResponseStatus(event, 400);
    return {
      statusCode: 400,
      message: "Invalid JSON body",
    };
  }

  // メッセージの型チェック
  if (typeof body.message !== 'string') {
    setResponseStatus(event, 400);
    return {
      statusCode: 400,
      message: "Message must be a string",
    };
  }

  // メッセージの長さ制限（最大50文字）
  const trimmedMessage = body.message.trim();
  if (trimmedMessage.length === 0) {
    setResponseStatus(event, 400);
    return {
      statusCode: 400,
      message: "Message cannot be empty",
    };
  }
  if (trimmedMessage.length > 50) {
    setResponseStatus(event, 400);
    return {
      statusCode: 400,
      message: "Message too long (max 50 characters)",
    };
  }

  // XSS対策: 危険な文字をエスケープ
  const latestMessage = trimmedMessage
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // clientIdの検証（オプショナル）
  let clientId: string | undefined;
  if (body.clientId !== undefined) {
    if (typeof body.clientId !== 'string' || body.clientId.length > 100) {
      setResponseStatus(event, 400);
      return {
        statusCode: 400,
        message: "Invalid clientId",
      };
    }
    clientId = body.clientId;
  }

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
