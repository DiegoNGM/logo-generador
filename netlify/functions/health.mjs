const MODEL_NAME = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-flare";

export default async function health() {
  return new Response(
    JSON.stringify({
      configured: Boolean(process.env.OPENAI_API_KEY),
      model: MODEL_NAME,
    }),
    {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
    },
  );
}
