export default defineEventHandler(async () => {
  const storage = useStorage();
  const latestMessage = await storage.getItem("latest-message");

  if (!latestMessage) {
    return {
      statusCode: 400,
      message: "No message found",
    };
  }

  return {
    statusCode: 200,
    message: String(latestMessage),
  };
});
