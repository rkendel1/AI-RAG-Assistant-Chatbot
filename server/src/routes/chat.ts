import express, { Request, Response } from "express";
import Conversation, { IMessage } from "../models/Conversation";
import { chatWithAI } from "../services/geminiService";
import jwt from "jsonwebtoken";
import {
  ephemeralStore,
  createEphemeralConversation,
} from "../utils/ephemeralConversations";

const router = express.Router();

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Chat with the AI assistant.
 *     description: >
 *       Sends a chat message to the AI assistant. For authenticated users, the conversation is stored and
 *       retrieved from MongoDB; for unauthenticated users, an ephemeral in-memory conversation is used.
 *     tags:
 *       - Chat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: The message from the user.
 *                 example: "Hello, AI!"
 *               conversationId:
 *                 type: string
 *                 description: (Optional) The conversation ID to continue an existing conversation.
 *                 example: "60d5ec49f5a3c80015c0d9a4"
 *     responses:
 *       200:
 *         description: AI response returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
 *                   type: string
 *                   description: The AI-generated response.
 *                   example: "Hi there! How can I help you today?"
 *                 conversationId:
 *                   type: string
 *                   description: The conversation ID (either existing or newly created).
 *                   example: "60d5ec49f5a3c80015c0d9a4"
 *       400:
 *         description: Bad Request - Invalid or missing parameters.
 *       500:
 *         description: Server error.
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { message, conversationId } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ message: "Invalid or empty message." });
    }

    // Try to parse JWT token
    let userId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
          id?: string;
        };
        if (decoded && decoded.id) userId = decoded.id;
      } catch {
        userId = null;
      }
    }

    // -----------------------------------------------------------
    // CASE 1: Authenticated user -> store/load from MongoDB
    // -----------------------------------------------------------
    if (userId) {
      let conversation = null;
      let history: any[] = [];

      if (conversationId) {
        // Load existing conversation
        conversation = await Conversation.findOne({
          _id: conversationId,
          user: userId,
        });
        if (!conversation) {
          return res.status(404).json({ message: "Conversation not found" });
        }
        // Convert stored messages to the format your AI needs
        history = conversation.messages.map((msg: IMessage) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          parts: [{ text: msg.text }],
        }));
      } else {
        // Create a new conversation
        conversation = new Conversation({ user: userId, messages: [] });
        await conversation.save();
        history = [];
      }

      // Always prepend AI_INSTRUCTIONS at the start of the history.
      // If instructions are already present as the first message, you may want to avoid duplicating them.
      // For simplicity, we unconditionally prepend them.
      history.unshift({
        role: "user",
        parts: [{ text: process.env.AI_INSTRUCTIONS || "" }],
      });
      // Append the new user message
      history.push({ role: "user", parts: [{ text: message }] });

      // Call the AI service with the history
      const aiResponse = await chatWithAI(history, message);

      // Create an IMessage for the DB for the assistant's response
      const assistantMessage: IMessage = {
        sender: "assistant",
        text: aiResponse,
        timestamp: new Date(),
      };

      // Save both user and assistant messages in the DB
      conversation.messages.push({
        sender: "user",
        text: message,
        timestamp: new Date(),
      });
      conversation.messages.push(assistantMessage);
      await conversation.save();

      return res.json({
        answer: aiResponse,
        conversationId: conversation._id,
      });
    }

    // -----------------------------------------------------------
    // CASE 2: Unauthenticated user -> store/load from ephemeral memory
    // -----------------------------------------------------------
    let ephemeralHistory: any[];

    if (conversationId && ephemeralStore[conversationId]) {
      ephemeralHistory = ephemeralStore[conversationId];
    } else {
      // Create a new ephemeral conversation
      const newConvId = createEphemeralConversation();
      return handleNewGuestConversation(res, newConvId, message);
    }

    // Always prepend AI_INSTRUCTIONS at the start of the ephemeral history.
    ephemeralHistory.unshift({
      role: "user",
      parts: [{ text: process.env.AI_INSTRUCTIONS || "" }],
    });
    // Add the new user message
    ephemeralHistory.push({ role: "user", parts: [{ text: message }] });

    // Call the AI service with the ephemeral history.
    const aiResponse = await chatWithAI(ephemeralHistory, message);

    // Append the AI response to ephemeral history
    ephemeralHistory.push({
      role: "assistant",
      parts: [{ text: aiResponse }],
    });

    ephemeralStore[conversationId] = ephemeralHistory;

    return res.json({
      answer: aiResponse,
      conversationId,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Helper to handle brand-new guest conversations.
 */
async function handleNewGuestConversation(
  res: Response,
  conversationId: string,
  message: string,
) {
  let ephemeralHistory: any[] = [];
  ephemeralStore[conversationId] = ephemeralHistory;

  // Prepend the AI instructions first
  ephemeralHistory.unshift({
    role: "user",
    parts: [{ text: process.env.AI_INSTRUCTIONS || "" }],
  });
  // Add the user's message
  ephemeralHistory.push({ role: "user", parts: [{ text: message }] });

  // Call the AI service
  const aiResponse = await chatWithAI(ephemeralHistory, message);

  // Append the AI's response to the ephemeral history
  ephemeralHistory.push({
    role: "assistant",
    parts: [{ text: aiResponse }],
  });

  ephemeralStore[conversationId] = ephemeralHistory;

  return res.json({
    answer: aiResponse,
    conversationId,
  });
}

export default router;
