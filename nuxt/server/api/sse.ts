import { messageHooks } from "../utils/hooks";

/**
 * サーバーからUI側へメッセージの変更を送信する
 */
export default defineEventHandler(async (event) => {
  setHeader(event, "cache-control", "no-cache");
  setHeader(event, "connection", "keep-alive");
  setHeader(event, "content-type", "text/event-stream");
  setResponseStatus(event, 200);

  let counter = 0;

  const sendEvent = (data: { statusCode: number; message: string; clientId?: string }) => {
    event.node.res.write(`id: ${++counter}\n`);
    event.node.res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  messageHooks.hook("message:new", sendEvent);

  event.node.req.on("close", () => {
    messageHooks.removeHook("message:new", sendEvent);
  });

  event._handled = true;
});
