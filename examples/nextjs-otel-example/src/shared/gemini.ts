import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { wrapAISDKModel } from "@axiomhq/ai";

const geminiProvider = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const geminiFlash = wrapAISDKModel(
  geminiProvider("gemini-2.5-flash-preview-04-17")
);
