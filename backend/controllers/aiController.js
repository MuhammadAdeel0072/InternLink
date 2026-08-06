import client from "../config/openrouter.js";

export const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;

    const completion = await client.chat.completions.create({
      model: "nvidia/nemotron-3-ultra-550b-a55b:free", // Use the exact model ID from OpenRouter
      messages: [
        {
          role: "system",
          content: `
You are InternLink AI.

You help students with:
- Programming
- Career advice
- Resume tips
- Interview preparation
- General study questions
- Internship guidance

Be helpful, concise, and friendly.
`,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    res.json({
      success: true,
      reply: completion.choices[0].message.content,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "AI Error",
    });
  }
};