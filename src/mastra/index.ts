import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";

import { writingAgent } from "./agents/writing-agent";
import {
  toolCallAppropriatenessScorers,
  completenessScorers,
  grammarAccuracyScorers,
} from "./scorers/writing-scorer";

export const mastra = new Mastra({
  workflows: {},
  agents: { writingAgent },
  scorers: {
    toolCallAppropriatenessScorers,
    completenessScorers,
    grammarAccuracyScorers,
  },
  storage: new LibSQLStore({
    // stores observability, scores, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
  telemetry: {
    // Telemetry is deprecated and will be removed in the Nov 4th release
    enabled: false,
  },
  observability: {
    // Enables DefaultExporter and CloudExporter for AI tracing
    default: { enabled: true },
  },
});
