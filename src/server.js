import express from "express";

const app = express();
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "WriteRight Assistant",
    timestamp: new Date().toISOString(),
  });
});

// A2A endpoint for Telex.im
app.post("/a2a/agent/writingAssistant", async (req, res) => {
  try {
    const { text, context, userId } = req.body;

    console.log("📝 Received writing assistance request:", {
      text: text?.substring(0, 100) + (text?.length > 100 ? "..." : ""),
      context,
      userId,
    });

    // Simple grammar correction logic
    let improvedText = text;
    const corrections = [];

    // Common grammar fixes
    if (text?.includes(" are ") && text.includes(" I ")) {
      improvedText = improvedText.replace(/\bi are\b/gi, "I am");
      corrections.push('Fixed "I are" to "I am" (subject-verb agreement)');
    }

    if (text?.toLowerCase().includes("recieve")) {
      improvedText = improvedText.replace(/\brecieve\b/gi, "receive");
      corrections.push('Fixed "recieve" to "receive" (spelling)');
    }

    if (text?.includes(" alot ")) {
      improvedText = improvedText.replace(/\balot\b/gi, "a lot");
      corrections.push('Fixed "alot" to "a lot" (spelling)');
    }

    if (text?.includes(" its ") && !text.includes(" it's ")) {
      improvedText = improvedText.replace(/\bits\b/gi, "it's");
      corrections.push('Fixed "its" to "it\'s" (contraction)');
    }

    // Capitalize first letter and add period if missing
    if (improvedText && improvedText.length > 0) {
      improvedText =
        improvedText.charAt(0).toUpperCase() + improvedText.slice(1);
      if (!/[.!?]$/.test(improvedText)) {
        improvedText += ".";
      }
    }

    const response = {
      type: "message",
      content: {
        text: formatTelexResponse(improvedText, corrections, context),
        format: "markdown",
      },
    };

    console.log("✅ Response sent successfully");
    res.json(response);
  } catch (error) {
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

function formatTelexResponse(improvedText, corrections, context) {
  let response = `✍️ **WriteRight Writing Assistant**\n\n`;

  response += `**Improved Text:**\n${improvedText}\n\n`;

  if (corrections.length > 0) {
    response += `**Corrections Made:**\n`;
    corrections.forEach((correction, index) => {
      response += `• ${correction}\n`;
    });
    response += `\n`;
  } else {
    response += `**Note:** No corrections needed! Your writing looks good.\n\n`;
  }

  response += `**Context:** ${context || "casual"}\n\n`;

  response += `---\n`;
  response += `*Tip: Try different contexts like "professional", "academic", or "creative" for tailored improvements.*`;

  return response;
}

// Additional demo endpoint
app.post("/api/demo", (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  res.json({
    success: true,
    original: text,
    improved: text, // In full version, this would be processed by AI
    message: "Demo endpoint - AI processing would happen here",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 WriteRight Assistant running on port ${PORT}`);
  console.log(`📍 Health Check: http://localhost:${PORT}/health`);
  console.log(
    `📍 A2A Endpoint: http://localhost:${PORT}/a2a/agent/writingAssistant`
  );
  console.log(`📍 Demo API: http://localhost:${PORT}/api/demo`);
});

export default app;
