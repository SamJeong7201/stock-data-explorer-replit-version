import OpenAI from "openai";

/**
 * Shared OpenAI client instance.
 * Reads credentials from environment variables at startup.
 * Instantiated once and reused across all routes.
 *
 * Required env vars:
 *   AI_INTEGRATIONS_OPENAI_BASE_URL
 *   AI_INTEGRATIONS_OPENAI_API_KEY
 */
export const openai = new OpenAI({
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"],
});
