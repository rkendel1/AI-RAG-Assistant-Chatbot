/**
 * @fileoverview Types for conversation
 */

/**
 * Message interface
 */
export interface IMessage {
  sender: "user" | "assistant";
  text: string;
  timestamp: Date;
}

/**
 * Conversation interface
 */
export interface IConversation {
  _id: string;
  user: string;
  title: string;
  messages: IMessage[];
  createdAt: string;
  updatedAt: string;
}
