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
  await storage.setItem("latest-message", latestMessage);

  return {
    statusCode: 200,
    message: latestMessage,
  };
});
