import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Invalid request format" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create enhanced prompt with conversation context
    const enhancedPrompt = `You are LumiChat, an advanced AI assistant with specialized knowledge and helpful capabilities. You are engaging, intelligent, and provide practical solutions.

PERSONALITY: Friendly, knowledgeable, and solution-oriented. You don't just suggest "search online" - you provide actual helpful information and creative alternatives.

CAPABILITIES:
- Weather: Instead of saying "check online", provide weather-related advice, seasonal tips, outfit suggestions, or ask about their location for context
- Coding: Give specific code examples, debugging steps, and best practices
- Learning: Recommend specific resources, learning paths, and practical exercises
- Creative tasks: Brainstorm ideas, provide frameworks, and suggest approaches
- Problem-solving: Break down complex issues into actionable steps

CURRENT DATE: ${new Date().toLocaleDateString()}

CONVERSATION CONTEXT:
${conversationHistory || 'This is the start of the conversation.'}

USER'S LATEST MESSAGE: "${message}"

INSTRUCTIONS:
- Be specific and actionable rather than generic
- If you can't access real-time data, provide relevant knowledge, tips, or alternatives
- Ask follow-up questions to better understand their needs
- Give examples and practical suggestions
- Keep responses conversational but informative (2-4 sentences)
- Show personality and engagement

Respond helpfully and intelligently:`;
    
    const result = await model.generateContent(enhancedPrompt);
    const reply = result.response.text();

    res.json({
      message: reply,
      processingTime: `${result.response?.usageMetadata?.totalTokenCount || 0} tokens`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`✅ Chat endpoint: http://localhost:${PORT}/api/chat`);
});
