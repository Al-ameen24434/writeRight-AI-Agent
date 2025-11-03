import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const userPreferencesTool = createTool({
  id: "user-preferences",
  description: "Get user writing preferences and history from memory",
  inputSchema: z.object({
    userId: z.string(),
  }),
  outputSchema: z.object({
    preferredTone: z.string().optional(),
    commonMistakes: z.array(z.string()).optional(),
    writingGoals: z.array(z.string()).optional(),
    proficiencyLevel: z.string().optional(),
    totalSessions: z.number().optional(),
  }),
  execute: async ({ context }) => {
    const { userId } = context;
    const { agent } = context as any;

    if (!agent?.memory) {
      return {
        preferredTone: "professional",
        commonMistakes: [],
        writingGoals: ["clarity", "professionalism"],
        proficiencyLevel: "intermediate",
        totalSessions: 0,
      };
    }

    try {
      const preferences = await agent.memory.get(`user:${userId}:preferences`);
      const history = await agent.memory.get(`user:${userId}:history`);

      return {
        preferredTone: preferences?.tone || "professional",
        commonMistakes: history?.commonMistakes || [],
        writingGoals: preferences?.goals || ["clarity", "professionalism"],
        proficiencyLevel: preferences?.proficiency || "intermediate",
        totalSessions: history?.sessions || 0,
      };
    } catch (error) {
      console.error("Memory access error:", error);
      return {
        preferredTone: "professional",
        commonMistakes: [],
        writingGoals: ["clarity", "professionalism"],
        proficiencyLevel: "intermediate",
        totalSessions: 0,
      };
    }
  },
});

export const updateUserPreferencesTool = createTool({
  id: "update-preferences",
  description:
    "Update user writing preferences and learning progress in memory",
  inputSchema: z.object({
    userId: z.string(),
    preferences: z
      .object({
        tone: z.string().optional(),
        goals: z.array(z.string()).optional(),
        proficiency: z.string().optional(),
      })
      .optional(),
    feedback: z
      .object({
        mistakeType: z.string().optional(),
        improvementArea: z.string().optional(),
        context: z.string().optional(),
      })
      .optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    updated: z.object({
      preferences: z.boolean(),
      history: z.boolean(),
    }),
  }),
  execute: async ({ context }) => {
    const { userId, preferences, feedback } = context;
    const { agent } = context as any;

    if (!agent?.memory) {
      return {
        success: false,
        updated: { preferences: false, history: false },
      };
    }

    try {
      let prefsUpdated = false;
      let historyUpdated = false;

      // Update preferences
      if (preferences) {
        const currentPrefs =
          (await agent.memory.get(`user:${userId}:preferences`)) || {};
        await agent.memory.set(`user:${userId}:preferences`, {
          ...currentPrefs,
          ...preferences,
          updatedAt: new Date().toISOString(),
        });
        prefsUpdated = true;
      }

      // Update learning history
      if (feedback) {
        const history = (await agent.memory.get(`user:${userId}:history`)) || {
          commonMistakes: [],
          improvementHistory: [],
          sessions: 0,
          firstSession: new Date().toISOString(),
        };

        // Add new mistake type if not already tracked
        if (
          feedback.mistakeType &&
          !history.commonMistakes.includes(feedback.mistakeType)
        ) {
          history.commonMistakes.push(feedback.mistakeType);
        }

        // Add to improvement history
        history.improvementHistory.push({
          ...feedback,
          timestamp: new Date().toISOString(),
        });

        // Increment session count
        history.sessions += 1;
        history.lastSession = new Date().toISOString();

        await agent.memory.set(`user:${userId}:history`, history);
        historyUpdated = true;
      }

      return {
        success: true,
        updated: {
          preferences: prefsUpdated,
          history: historyUpdated,
        },
      };
    } catch (error) {
      console.error("Memory update error:", error);
      return {
        success: false,
        updated: { preferences: false, history: false },
      };
    }
  },
});

export const grammarCheckTool = createTool({
  id: "grammar-check",
  description: "Check and correct grammatical errors in text",
  inputSchema: z.object({
    text: z.string(),
    context: z.enum(["casual", "professional", "academic", "creative"]),
    userId: z.string().optional(),
  }),
  outputSchema: z.object({
    correctedText: z.string(),
    errors: z.array(
      z.object({
        type: z.string(),
        original: z.string(),
        correction: z.string(),
        explanation: z.string(),
        isRecurring: z.boolean(),
      })
    ),
  }),
  execute: async ({ context }) => {
    const { text, context: writingContext, userId } = context;
    const { agent } = context as any;

    let commonMistakes: string[] = [];

    // Get user's common mistakes from memory if available
    if (agent?.memory && userId) {
      try {
        const history = await agent.memory.get(`user:${userId}:history`);
        commonMistakes = history?.commonMistakes || [];
      } catch (error) {
        console.error("Error accessing memory for common mistakes:", error);
      }
    }

    // Simple grammar checking logic
    const errors: Array<{
      type: string;
      original: string;
      correction: string;
      explanation: string;
      isRecurring: boolean;
    }> = [];

    // Check for common errors
    if (text.includes(" are ") && text.includes(" I ")) {
      errors.push({
        type: "subject_verb_agreement",
        original: "are",
        correction: "am",
        explanation:
          'Subject-verb agreement: "I" should be followed by "am" not "are"',
        isRecurring: commonMistakes.includes("subject_verb_agreement"),
      });
    }

    if (text.toLowerCase().includes("recieve")) {
      errors.push({
        type: "spelling",
        original: "recieve",
        correction: "receive",
        explanation: 'Spelling correction: "i before e except after c" rule',
        isRecurring: commonMistakes.includes("spelling"),
      });
    }

    if (text.includes(" alot ")) {
      errors.push({
        type: "spelling",
        original: "alot",
        correction: "a lot",
        explanation: 'Spelling correction: "a lot" should be two words',
        isRecurring: commonMistakes.includes("spelling"),
      });
    }

    let correctedText = text;
    errors.forEach((error) => {
      correctedText = correctedText.replace(
        new RegExp(error.original, "gi"),
        error.correction
      );
    });

    return {
      correctedText: correctedText || text,
      errors,
    };
  },
});

export const readabilityAnalyzerTool = createTool({
  id: "readability-analyzer",
  description: "Analyze text readability and suggest improvements",
  inputSchema: z.object({
    text: z.string(),
    userId: z.string().optional(),
  }),
  outputSchema: z.object({
    score: z.number(),
    level: z.string(),
    suggestions: z.array(z.string()),
    comparedToPrevious: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const { text, userId } = context;
    const { agent } = context as any;

    // Simple readability analysis
    const wordCount = text.split(/\s+/).length;
    const sentenceCount = text
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0).length;
    const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;

    let score = Math.max(0, Math.min(100, 100 - avgSentenceLength * 2));

    // Adjust score based on user's proficiency level if available
    if (agent?.memory && userId) {
      try {
        const preferences = await agent.memory.get(
          `user:${userId}:preferences`
        );
        const proficiency = preferences?.proficiency;

        if (proficiency === "beginner" && score < 70) score += 10;
        if (proficiency === "advanced" && score > 80) score -= 5;
      } catch (error) {
        console.error("Error adjusting score for proficiency:", error);
      }
    }

    return {
      score,
      level:
        score > 80
          ? "Excellent"
          : score > 60
            ? "Good"
            : score > 40
              ? "Fair"
              : "Needs Improvement",
      suggestions: [
        "Use shorter sentences for better readability",
        "Simplify complex vocabulary where possible",
        "Improve paragraph structure and flow",
        "Add transition words for better coherence",
      ],
      comparedToPrevious: "similar",
    };
  },
});

export const writingStyleTool = createTool({
  id: "writing-style",
  description: "Analyze and improve writing style for different contexts",
  inputSchema: z.object({
    text: z.string(),
    currentContext: z.enum(["casual", "professional", "academic", "creative"]),
    targetContext: z.enum(["casual", "professional", "academic", "creative"]),
    userId: z.string().optional(),
  }),
  outputSchema: z.object({
    improvedText: z.string(),
    styleChanges: z.array(z.string()),
    toneAdjustment: z.string(),
  }),
  execute: async ({ context }) => {
    const { text, currentContext, targetContext, userId } = context;
    const { agent } = context as any;

    let userPreferredTone = "professional";

    // Get user's tone preference from memory if available
    if (agent?.memory && userId) {
      try {
        const preferences = await agent.memory.get(
          `user:${userId}:preferences`
        );
        userPreferredTone = preferences?.tone || "professional";
      } catch (error) {
        console.error("Error accessing memory for tone preferences:", error);
      }
    }

    // Mock style transformation
    const styleMap: Record<string, Record<string, string[]>> = {
      casual: {
        professional: [
          "Changing informal language to formal",
          "Adding professional greetings",
          "Using complete sentences",
        ],
        academic: [
          "Adding formal structure",
          "Using academic vocabulary",
          "Improving citation style",
        ],
        creative: [
          "Enhancing descriptive language",
          "Adding expressive elements",
          "Improving narrative flow",
        ],
      },
      professional: {
        casual: [
          "Making language more conversational",
          "Shortening sentences",
          "Adding friendly tone",
        ],
        academic: [
          "Adding scholarly references",
          "Using formal academic language",
          "Improving research tone",
        ],
        creative: [
          "Adding storytelling elements",
          "Using more descriptive language",
          "Enhancing engagement",
        ],
      },
    };

    const changes = styleMap[currentContext]?.[targetContext] || [
      "Adjusting tone and style",
      "Improving language appropriateness",
    ];

    return {
      improvedText: text, // In real implementation, this would be the transformed text
      styleChanges: changes,
      toneAdjustment: `Adjusted from ${currentContext} to ${targetContext} tone`,
    };
  },
});
