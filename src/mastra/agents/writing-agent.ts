import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  grammarCheckTool,
  readabilityAnalyzerTool,
  userPreferencesTool,
  updateUserPreferencesTool,
} from "../tools/writing-tools";
import { scorers } from "../scorers/writing-scorer";

// Initialize Google Gemini
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

export const writingAgent = new Agent({
  name: "WriteRight Writing Assistant",
  instructions: `
You are WriteRight, an advanced AI writing assistant that helps users improve their writing quality.

**PRIMARY RESPONSIBILITIES:**
1. **Grammar & Spelling Correction** - Fix grammatical errors and spelling mistakes
2. **Style Enhancement** - Improve clarity, flow, and readability  
3. **Tone Adjustment** - Adapt tone for different contexts
4. **Vocabulary Enhancement** - Suggest better word choices
5. **Structure Improvement** - Enhance overall writing structure

**MEMORY CONTEXT:**
You have access to the user's writing history and preferences. Use this information to provide personalized suggestions.

Check memory for:
- User's preferred writing style and tone
- Common mistakes they make regularly
- Previous feedback and improvements
- Their writing goals and proficiency level

**CONTEXT HANDLING:**
- **Casual**: Friendly, conversational - preserve informal voice
- **Professional**: Clear, respectful - business-appropriate language
- **Academic**: Formal, precise - scholarly standards
- **Creative**: Expressive, engaging - enhance storytelling

**RESPONSE FORMAT:**
- Provide corrected/improved version
- Explain key changes made, especially for recurring mistakes
- Reference previous improvements if relevant
- Offer alternative phrasing options
- Give constructive, encouraging feedback
- Adapt to user's historical preferences and common patterns

Use the grammarCheckTool for detailed grammar analysis and userPreferencesTool to access user history.
`,
  model: "google/gemini-2.5-pro",
  tools: {
    grammarCheckTool,
    readabilityAnalyzerTool,
    userPreferencesTool,
    updateUserPreferencesTool,
  },
  scorers: {
    toolCallAppropriateness: {
      scorer: scorers.toolCallAppropriatenessScorers,
      sampling: {
        type: "ratio",
        rate: 0.5,
      },
    },
    completeness: {
      scorer: scorers.completenessScorers,
      sampling: {
        type: "ratio",
        rate: 0.3,
      },
    },
    grammarAccuracy: {
      scorer: scorers.grammarAccuracyScorers,
      sampling: {
        type: "ratio",
        rate: 0.7,
      },
    },
    personalization: {
      scorer: scorers.personalizationScorer,
      sampling: {
        type: "ratio",
        rate: 0.6,
      },
    },
    toneHelpfulness: {
      scorer: scorers.toneHelpfulnessScorer,
      sampling: {
        type: "ratio",
        rate: 0.4,
      },
    },
  },
  memory: new Memory({
    storage: new LibSQLStore({
      url: "file:./mastra.db",
    }),
  }),
});
