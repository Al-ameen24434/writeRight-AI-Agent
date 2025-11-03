import express from "express";
import { mastra } from "./mastra/index";

const app = express();
app.use(express.json());

// SINGLE ENDPOINT - A2A for Telex.im
app.post("/a2a/agent/writingAssistant", async (req, res) => {
  try {
    const { text, context, userId } = req.body;

    console.log("📝 Received writing assistance request:", {
      text: text?.substring(0, 100) + (text?.length > 100 ? "..." : ""),
      context,
      userId,
    });

    // Generate response using the agent
    const result = await (mastra as any).writingAgent.generate({
      messages: [{ role: "user", content: text }],
      context: context || "casual",
      userId: userId || "anonymous",
    });

    // Format response for Telex.im
    const response = {
      type: "message",
      content: {
        text: formatTelexResponse(result),
        format: "markdown",
      },
    };

    console.log("✅ Response sent successfully");
    res.json(response);
  } catch (error: any) {
    console.error("❌ A2A Error:", error.message);

    res.status(500).json({
      type: "message",
      content: {
        text: "⚠️ Sorry, I encountered an error processing your writing. Please try again.",
        format: "markdown",
      },
    });
  }
});

function formatTelexResponse(agentResult: any): string {
  let response = `✍️ **WriteRight Writing Assistant**\n\n`;

  // Main improved text
  if (agentResult.text) {
    response += `**Improved Text:**\n${agentResult.text}\n\n`;
  }

  // Explanation of changes
  if (agentResult.explanation) {
    response += `**Explanation:**\n${agentResult.explanation}\n\n`;
  }

  // Suggestions for improvement
  if (agentResult.suggestions && agentResult.suggestions.length > 0) {
    response += `**Suggestions:**\n`;
    agentResult.suggestions.forEach((suggestion: string, index: number) => {
      response += `• ${suggestion}\n`;
    });
    response += `\n`;
  }

  // Footer with usage tips
  response += `---\n`;
  response += `*Tip: Specify context like "professional", "academic", or "casual" for better results.*`;

  return response;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 WriteRight Assistant running on port ${PORT}`);
  console.log(
    `📍 Single A2A Endpoint: http://localhost:${PORT}/a2a/agent/writingAssistant`
  );
});
