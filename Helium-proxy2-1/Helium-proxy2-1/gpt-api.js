import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const router = express.Router();

// Initialize OpenAI configuration only if API key is available
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Middleware to check authentication
const checkAuth = (req, res, next) => {
  const sessionId = req.headers["x-session-id"];
  
  if (!sessionId) {
    return res.status(401).json({ error: "Unauthorized - Please log in" });
  }
  
  // Validate session ID format (should be a valid UUID-like string)
  const sessionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$|^[0-9]{9,12}$/i;
  if (!sessionIdPattern.test(sessionId)) {
    return res.status(401).json({ error: "Invalid session format" });
  }
  
  // In a production app, you would validate the session ID against your database
  // For now, we accept any valid-format session ID
  next();
};

router.post("/", checkAuth, async (req, res) => {
  try {
    // Set up event stream for the response
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Process the incoming request
    const { newMessage } = req.body;

    if (!newMessage) {
      res.write(`data: Error: No message provided\n\n`);
      res.end();
      return;
    }

    // If OpenAI API key is not configured, use mock response
    if (!openai) {
      const words =
        `I received your message: "${newMessage}". This is a sample response from the GPT service. The actual GPT integration requires API keys and proper configuration.`.split(
          " ",
        );

      // Send words one by one with delay to simulate streaming
      for (let i = 0; i < words.length; i++) {
        res.write(`data: ${JSON.stringify({type: "live", data: words[i] + " "})}\n\n`);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      res.write(`data: ${JSON.stringify({type: "end", data: JSON.stringify({success: true})})}\n\n`);
      res.end();
      return;
    }

    try {
      // Request to OpenAI API with streaming
      // Using GPT-4 as the model (GPT-5 doesn't exist yet)
      const stream = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: newMessage }],
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          res.write(`data: ${JSON.stringify({type: "live", data: content})}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({type: "end", data: JSON.stringify({success: true})})}\n\n`);
      res.end();
    } catch (apiError) {
      console.error("OpenAI API Error:", apiError);
      res.write(`data: Error: ${apiError.message || "An error occurred with the GPT service"}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error("Error in GPT API:", error);
    res.status(500).send({ error: "Failed to process GPT request" });
  }
});

export default router;