export default defineEventHandler(async () => {
  const storage = useStorage();
  const latestMessage = await storage.getItem("latest-message");

  return {
    statusCode: 200,
    message: latestMessage,
  };
});
