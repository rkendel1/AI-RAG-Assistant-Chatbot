import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerationConfig,
} from "@google/generative-ai";
import dotenv from "dotenv";
import { searchKnowledge } from "../scripts/queryKnowledge";

dotenv.config();

/**
 * Sends a chat message to Gemini AI, first searching Pinecone for relevant knowledge.
 * If no relevant knowledge is found, Gemini still responds with general information.
 * @param history - The conversation history.
 * @param message - The new user message.
 * @param systemInstruction - (Optional) A system instruction to guide the AI.
 * @returns A promise resolving with the AI's response text.
 */
export const chatWithAI = async (
  history: Array<any>,
  message: string,
  systemInstruction?: string,
): Promise<string> => {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error("Missing GOOGLE_AI_API_KEY in environment variables");
  }

  // Search Pinecone for relevant context before querying Gemini AI
  const pineconeResults = await searchKnowledge(message, 3);
  let additionalContext = "";

  if (pineconeResults.length > 0) {
    additionalContext = `\n\nRelevant Information:\n${pineconeResults
      .map((r) => `- ${r.text}`)
      .join("\n")}`;
  } else {
    additionalContext =
      "No relevant knowledge found in Pinecone. You are a highly intelligent AI assistant. If relevant information is found in the user's internal database, include it in your response. However, if no relevant information is found, use your general knowledge to answer the question accurately and in detail.\n";
  }

  console.log(
    "🧠 Enriching AI with Pinecone knowledge:",
    JSON.stringify(additionalContext, null, 2),
  );

  // Combine system instructions with knowledge base context
  const fullSystemInstruction = process.env.AI_INSTRUCTIONS || "";

  // Initialize Gemini AI
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: fullSystemInstruction,
  });

  const generationConfig: GenerationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
  };

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

  // Add Pinecone results to history
  history.push({ role: "user", parts: [{ text: message }] });
  history.push({ role: "user", parts: [{ text: additionalContext }] });

  // Start chat session
  const chatSession = model.startChat({
    generationConfig,
    safetySettings,
    history: history,
  });

  const result = await chatSession.sendMessage(message);

  if (!result.response || !result.response.text) {
    throw new Error("Failed to get text response from the AI.");
  }

  return result.response.text();
};
