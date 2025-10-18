let latestMessage = "";

export default defineEventHandler(() => {
  return {
    statusCode: 200,
    message: latestMessage,
  };
});
