export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const storage = useStorage();

  if (!body || body.message === null || body.message === undefined) {
    return {
      statusCode: 400,
      message: "Invalid JSON body",
    };
  }

  await storage.setItem("latest-message", body.message);

  return {
    statusCode: 200,
    message: body.message,
  };
});
