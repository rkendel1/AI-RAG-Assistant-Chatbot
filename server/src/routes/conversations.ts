import express, { Request, Response } from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import Conversation, { IConversation, IMessage } from '../models/Conversation';

const router = express.Router();

/**
 * @swagger
 * /api/conversations:
 *   post:
 *     summary: Create a new conversation.
 *     description: Creates a new conversation for the authenticated user with a default title of "New Conversation".
 *     tags:
 *       - Conversations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A conversation object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conversation'
 *       500:
 *         description: Internal server error.
 */
router.post('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const conversation = new Conversation({
      user: userId,
      title: "New Conversation",
      messages: []
    });
    await conversation.save();
    res.json(conversation);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: Get all conversations for the authenticated user.
 *     tags:
 *       - Conversations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of conversations.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Conversation'
 *       500:
 *         description: Internal server error.
 */
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const conversations = await Conversation.find({ user: userId });
    res.json(conversations);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/conversations/{id}:
 *   get:
 *     summary: Get a conversation by ID.
 *     tags:
 *       - Conversations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The conversation ID.
 *     responses:
 *       200:
 *         description: A conversation object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conversation'
 *       404:
 *         description: Conversation not found.
 *       500:
 *         description: Internal server error.
 */
router.get('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const conversation = await Conversation.findOne({ _id: req.params.id, user: userId });
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    res.json(conversation);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/conversations/{id}:
 *   put:
 *     summary: Rename (update) a conversation's title.
 *     tags:
 *       - Conversations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The conversation ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Conversation Title"
 *     responses:
 *       200:
 *         description: The updated conversation object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conversation'
 *       404:
 *         description: Conversation not found.
 *       500:
 *         description: Internal server error.
 */
router.put('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { title } = req.body;
    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { title },
      { new: true }
    );
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    res.json(conversation);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/conversations/search/{query}:
 *   get:
 *     summary: Search conversations by title or message content.
 *     tags:
 *       - Conversations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: The search query.
 *     responses:
 *       200:
 *         description: A list of conversations matching the search criteria.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Conversation'
 *       500:
 *         description: Internal server error.
 */
router.get('/search/:query', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const query = req.params.query;
    // Search by conversation title or within messages' text
    const conversations = await Conversation.find({
      user: userId,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { "messages.text": { $regex: query, $options: 'i' } }
      ]
    });
    res.json(conversations);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/conversations/{id}:
 *   delete:
 *     summary: Delete a conversation.
 *     tags:
 *       - Conversations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The conversation ID to delete.
 *     responses:
 *       200:
 *         description: Conversation deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Conversation deleted successfully"
 *       404:
 *         description: Conversation not found.
 *       500:
 *         description: Internal server error.
 */
router.delete('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const conversation = await Conversation.findOneAndDelete({ _id: req.params.id, user: userId });
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    res.json({ message: "Conversation deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
