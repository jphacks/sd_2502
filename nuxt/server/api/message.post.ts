let latestMessage = "";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body || body.message === null || body.message === undefined) {
    return {
      statusCode: 400,
      message: "Invalid JSON body",
    };
  }

  latestMessage = body.message;

  return {
    statusCode: 200,
    message: latestMessage,
  };
});
