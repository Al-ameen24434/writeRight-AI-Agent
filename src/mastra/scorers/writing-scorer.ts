import { z } from "zod";
import { createToolCallAccuracyScorerCode } from "@mastra/evals/scorers/code";
import { createCompletenessScorer } from "@mastra/evals/scorers/code";
import { createScorer } from "@mastra/core/scores";

// Scorer for appropriate tool usage
export const toolCallAppropriatenessScorers = createToolCallAccuracyScorerCode({
  expectedTool: "grammarCheckTool",
  strictMode: false,
});

export const completenessScorers = createCompletenessScorer();

// Scorer for grammar correction accuracy
export const grammarAccuracyScorers = createScorer({
  name: "Grammar Accuracy",
  description: "Evaluates if grammar corrections are accurate and appropriate",
  type: "agent",
  judge: {
    model: "google/gemini-2.5-pro",
    instructions:
      "You are an expert writing evaluator. Assess whether the grammar corrections made by the writing assistant are accurate, appropriate, and improve the text. " +
      "Consider if the corrections fix actual errors while preserving the original meaning. " +
      "Return only the structured JSON matching the provided schema.",
  },
})
  .preprocess(({ run }) => {
    const userText = (run.input?.inputMessages?.[0]?.content as string) || "";
    const assistantText = (run.output?.[0]?.content as string) || "";
    return { userText, assistantText };
  })
  .analyze({
    description: "Evaluate grammar correction quality and appropriateness",
    outputSchema: z.object({
      errorsDetected: z.boolean(),
      correctionsAccurate: z.boolean(),
      meaningPreserved: z.boolean(),
      improvementMade: z.boolean(),
      confidence: z.number().min(0).max(1).default(1),
      explanation: z.string().default(""),
    }),
    createPrompt: ({ results }) => `
            You are evaluating a writing assistant's grammar corrections.
            
            Original User Text:
            """
            ${results.preprocessStepResult.userText}
            """
            
            Assistant's Corrected Text:
            """
            ${results.preprocessStepResult.assistantText}
            """
            
            Tasks:
            1) Identify if the original text contained grammatical errors
            2) Check if the corrections are linguistically accurate
            3) Verify that the original meaning was preserved
            4) Assess if the corrections actually improve the text
            
            Return JSON with fields:
            {
              "errorsDetected": boolean, // Were there actual errors in the original?
              "correctionsAccurate": boolean, // Are the corrections linguistically correct?
              "meaningPreserved": boolean, // Is the original meaning maintained?
              "improvementMade": boolean, // Does the correction improve the text?
              "confidence": number, // 0-1 confidence in evaluation
              "explanation": string // Brief explanation of the evaluation
            }
        `,
  })
  .generateScore(({ results }) => {
    const r = (results as any)?.analyzeStepResult || {};

    if (!r.errorsDetected) return 1; // No errors to correct

    let score = 0;
    if (r.correctionsAccurate) score += 0.4;
    if (r.meaningPreserved) score += 0.3;
    if (r.improvementMade) score += 0.3;

    return Math.max(0, Math.min(1, score * (r.confidence ?? 1)));
  })
  .generateReason(({ results, score }) => {
    const r = (results as any)?.analyzeStepResult || {};
    return `Grammar accuracy: errorsDetected=${r.errorsDetected}, correctionsAccurate=${r.correctionsAccurate}, meaningPreserved=${r.meaningPreserved}, improvementMade=${r.improvementMade}. Score=${score}. ${r.explanation ?? ""}`;
  });

// Scorer for personalized feedback quality
export const personalizationScorer = createScorer({
  name: "Personalization Quality",
  description:
    "Evaluates if the assistant provides personalized feedback based on user history",
  type: "agent",
  judge: {
    model: "google/gemini-2.5-pro",
    instructions:
      "You are an expert evaluator of personalized writing feedback. Assess whether the writing assistant provides tailored suggestions based on user context and history. " +
      "Look for personalized language, references to user preferences, and context-aware improvements. " +
      "Return only the structured JSON matching the provided schema.",
  },
})
  .preprocess(({ run }) => {
    const userText = (run.input?.inputMessages?.[0]?.content as string) || "";
    const assistantText = (run.output?.[0]?.content as string) || "";
    return { userText, assistantText };
  })
  .analyze({
    description: "Evaluate personalization in writing feedback",
    outputSchema: z.object({
      personalizedLanguage: z.boolean(),
      referencesHistory: z.boolean(),
      contextAware: z.boolean(),
      tailoredSuggestions: z.boolean(),
      confidence: z.number().min(0).max(1).default(1),
      explanation: z.string().default(""),
    }),
    createPrompt: ({ results }) => `
            You are evaluating how personalized a writing assistant's feedback is.
            
            User Text:
            """
            ${results.preprocessStepResult.userText}
            """
            
            Assistant Response:
            """
            ${results.preprocessStepResult.assistantText}
            """
            
            Tasks:
            1) Check if the assistant uses personalized language (mentions "you", "your writing", etc.)
            2) Look for references to user history, preferences, or past interactions
            3) Assess if suggestions are tailored to the specific context of the text
            4) Determine if the feedback feels generic or specifically tailored
            
            Return JSON with fields:
            {
              "personalizedLanguage": boolean, // Uses "you", "your" and addresses user directly
              "referencesHistory": boolean, // References past interactions or user preferences
              "contextAware": boolean, // Suggestions match the text's context (casual/professional/etc.)
              "tailoredSuggestions": boolean, // Suggestions feel specific to this text, not generic
              "confidence": number, // 0-1 confidence in evaluation
              "explanation": string // Brief explanation
            }
        `,
  })
  .generateScore(({ results }) => {
    const r = (results as any)?.analyzeStepResult || {};

    let score = 0;
    if (r.personalizedLanguage) score += 0.3;
    if (r.referencesHistory) score += 0.3;
    if (r.contextAware) score += 0.2;
    if (r.tailoredSuggestions) score += 0.2;

    return Math.max(0, Math.min(1, score * (r.confidence ?? 1)));
  })
  .generateReason(({ results, score }) => {
    const r = (results as any)?.analyzeStepResult || {};
    return `Personalization: personalizedLanguage=${r.personalizedLanguage}, referencesHistory=${r.referencesHistory}, contextAware=${r.contextAware}, tailoredSuggestions=${r.tailoredSuggestions}. Score=${score}. ${r.explanation ?? ""}`;
  });

// Scorer for constructive tone and helpfulness
export const toneHelpfulnessScorer = createScorer({
  name: "Tone and Helpfulness",
  description:
    "Evaluates if the assistant maintains a constructive tone and provides helpful explanations",
  type: "agent",
  judge: {
    model: "google/gemini-2.5-pro",
    instructions:
      "You are an expert evaluator of writing feedback tone and helpfulness. Assess whether the writing assistant maintains a constructive, encouraging tone while providing clear explanations. " +
      "Look for positive reinforcement, clear reasoning, and actionable suggestions. " +
      "Return only the structured JSON matching the provided schema.",
  },
})
  .preprocess(({ run }) => {
    const assistantText = (run.output?.[0]?.content as string) || "";
    return { assistantText };
  })
  .analyze({
    description: "Evaluate tone and helpfulness of writing feedback",
    outputSchema: z.object({
      constructiveTone: z.boolean(),
      clearExplanations: z.boolean(),
      actionableSuggestions: z.boolean(),
      encouragingLanguage: z.boolean(),
      confidence: z.number().min(0).max(1).default(1),
      explanation: z.string().default(""),
    }),
    createPrompt: ({ results }) => `
            You are evaluating the tone and helpfulness of a writing assistant's feedback.
            
            Assistant Response:
            """
            ${results.preprocessStepResult.assistantText}
            """
            
            Tasks:
            1) Assess if the tone is constructive and positive (not critical or demeaning)
            2) Check if explanations for changes are clear and understandable
            3) Look for actionable suggestions the user can apply
            4) Identify encouraging language that motivates improvement
            
            Return JSON with fields:
            {
              "constructiveTone": boolean, // Positive, helpful tone rather than critical
              "clearExplanations": boolean, // Reasons for changes are explained clearly
              "actionableSuggestions": boolean, // Provides specific, implementable advice
              "encouragingLanguage": boolean, // Uses motivating and positive language
              "confidence": number, // 0-1 confidence in evaluation
              "explanation": string // Brief explanation
            }
        `,
  })
  .generateScore(({ results }) => {
    const r = (results as any)?.analyzeStepResult || {};

    let score = 0;
    if (r.constructiveTone) score += 0.3;
    if (r.clearExplanations) score += 0.3;
    if (r.actionableSuggestions) score += 0.2;
    if (r.encouragingLanguage) score += 0.2;

    return Math.max(0, Math.min(1, score * (r.confidence ?? 1)));
  })
  .generateReason(({ results, score }) => {
    const r = (results as any)?.analyzeStepResult || {};
    return `Tone & Helpfulness: constructiveTone=${r.constructiveTone}, clearExplanations=${r.clearExplanations}, actionableSuggestions=${r.actionableSuggestions}, encouragingLanguage=${r.encouragingLanguage}. Score=${score}. ${r.explanation ?? ""}`;
  });

export const scorers = {
  toolCallAppropriatenessScorers,
  completenessScorers,
  grammarAccuracyScorers,
  personalizationScorer,
  toneHelpfulnessScorer,
};
