import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerationConfig,
} from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

/**
 * Sends a chat message to the Gemini AI using the provided conversation history and returns the AI response.
 * @param history - The conversation history (an array of messages in the expected format).
 * @param message - The new user message.
 * @param systemInstruction - (Optional) A system instruction to guide the AI.
 * @returns A promise that resolves with the AI's response text.
 */
export const chatWithAI = async (
  history: Array<any>,
  message: string,
  systemInstruction?: string,
): Promise<string> => {
  // Check env vars
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error("Missing GOOGLE_AI_API_KEY in environment variables");
  }
  if (!process.env.AI_INSTRUCTIONS) {
    throw new Error("Missing AI_INSTRUCTIONS in environment variables");
  }

  // Combine optional system instruction with your env instructions
  const fullSystemInstruction = systemInstruction
    ? systemInstruction + " "
    : "";

  // Initialize the model
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    // @ts-ignore: The official types might not show systemInstruction, but it works
    systemInstruction: fullSystemInstruction,
  });

  // This generation config mirrors your working client code:
  const generationConfig: GenerationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
  };

  // Set up safety settings similarly
  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ];

  // Create the chat session with conversation history
  const chatSession = model.startChat({
    generationConfig,
    safetySettings,
    history,
  });

  // Send the new user message
  const result = await chatSession.sendMessage(message);

  // Validate result
  if (!result.response || !result.response.text) {
    throw new Error("Failed to get text response from the AI.");
  }

  return result.response.text();
};
