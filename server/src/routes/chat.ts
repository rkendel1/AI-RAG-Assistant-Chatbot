import express, { Request, Response } from 'express';
import Conversation, { IMessage } from '../models/Conversation';
import { chatWithAI } from '../services/geminiService';
import jwt from 'jsonwebtoken';
import { ephemeralStore, createEphemeralConversation } from '../utils/ephemeralConversations';

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
router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, conversationId } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: "Invalid or empty message." });
    }

    // Try to parse JWT token
    let userId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id?: string };
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
        conversation = await Conversation.findOne({ _id: conversationId, user: userId });
        if (!conversation) {
          return res.status(404).json({ message: "Conversation not found" });
        }
        // Convert stored messages to the format your AI needs
        history = conversation.messages.map((msg: IMessage) => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          parts: [{ text: msg.text }]
        }));
      } else {
        // Create a new conversation
        conversation = new Conversation({ user: userId, messages: [] });
        await conversation.save();
      }

      // Append the new user message
      history.push({ role: "user", parts: [{ text: message }] });

      history.push({ role: "user", parts: [{ text: process.env.AI_INSTRUCTIONS || "" }] });

      // Get AI response
      const aiResponse = await chatWithAI(history, message);

      // Create an IMessage for the DB
      const assistantMessage: IMessage = {
        sender: 'assistant',
        text: aiResponse,
        timestamp: new Date()
      };

      // Save both user and assistant messages in the DB
      conversation.messages.push({
        sender: 'user',
        text: message,
        timestamp: new Date()
      });
      conversation.messages.push(assistantMessage);
      await conversation.save();

      // Return the AI response + conversationId
      return res.json({
        answer: aiResponse,
        conversationId: conversation._id  // important for subsequent calls
      });
    }

    // -----------------------------------------------------------
    // CASE 2: Unauthenticated user -> store/load from ephemeral memory
    // -----------------------------------------------------------
    let ephemeralHistory: any[];

    // If we have a conversationId from the client, try loading it
    if (conversationId && ephemeralStore[conversationId]) {
      ephemeralHistory = ephemeralStore[conversationId];
    } else {
      // Otherwise, create a new ephemeral convo
      const newConvId = createEphemeralConversation();
      // Return the new ID to the client so they can reuse it
      return handleNewGuestConversation(res, newConvId, message);
    }

    // ephemeralHistory is an array of { role, parts[] }
    // Add the new user message
    ephemeralHistory.push({ role: "user", parts: [{ text: message }] });

    ephemeralHistory.push({ role: "user", parts: [{ text: process.env.AI_INSTRUCTIONS || "" }] });

    // Use your AI service
    const aiResponse = await chatWithAI(ephemeralHistory, message);

    // Store assistant message
    ephemeralHistory.push({
      role: "assistant",
      parts: [{ text: aiResponse }]
    });

    ephemeralStore[conversationId] = ephemeralHistory;

    // Return AI response + the same ephemeral conversationId
    return res.json({
      answer: aiResponse,
      conversationId // so the client can keep re-using it
    });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Helper to handle brand-new guest conversations:
 * Creates an ephemeral conversation, stores the initial user message, calls the AI, etc.
 */
async function handleNewGuestConversation(res: Response, conversationId: string, message: string) {
  // Start an empty ephemeral history
  let ephemeralHistory: any[] = [];
  ephemeralStore[conversationId] = ephemeralHistory;

  // Add the user's message
  ephemeralHistory.push({ role: "user", parts: [{ text: message }] });

  // Get AI response
  const aiResponse = await chatWithAI(ephemeralHistory, message);

  // Add the AI response to ephemeral memory
  ephemeralHistory.push({
    role: "assistant",
    parts: [{ text: aiResponse }]
  });

  ephemeralStore[conversationId] = ephemeralHistory;

  return res.json({
    answer: aiResponse,
    conversationId
  });
}

export default router;
