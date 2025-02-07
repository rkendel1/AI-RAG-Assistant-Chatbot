// /src/utils/ephemeralConversations.ts
import { v4 as uuidv4 } from 'uuid';

// Simple in-memory store:
// conversationId -> array of messages
export const ephemeralStore: Record<string, any[]> = {};

// Utility to create a new ephemeral conversation
export function createEphemeralConversation(): string {
  const newId = uuidv4();
  ephemeralStore[newId] = [];
  return newId;
}
