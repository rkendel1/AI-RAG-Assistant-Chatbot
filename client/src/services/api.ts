import axios from "axios";
import { IConversation } from "../types/conversation";

// You can adjust the baseURL if your server is different
const API = axios.create({
  baseURL: "https://ai-assistant-chatbot-server.vercel.app/api",
});

// --- Token Handling ---

/**
 * Store the token in local storage
 * @param token - The token to store
 */
export const setTokenInLocalStorage = (token: string) => {
  localStorage.setItem("token", token);
};

/**
 * Retrieve the token from local storage
 */
export const getTokenFromLocalStorage = (): string | null => {
  return localStorage.getItem("token");
};

/**
 * Clear the token from local storage
 */
export const isAuthenticated = (): boolean => {
  return !!getTokenFromLocalStorage();
};

// Attach token if available to all requests
API.interceptors.request.use((config) => {
  const token = getTokenFromLocalStorage();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// For guest users, store or retrieve the guestId
const GUEST_KEY = "guestConversationId";

export const setGuestIdInLocalStorage = (guestId: string) => {
  localStorage.setItem(GUEST_KEY, guestId);
};

export const getGuestIdFromLocalStorage = (): string | null => {
  return localStorage.getItem(GUEST_KEY);
};

export const clearGuestIdFromLocalStorage = (): void => {
  localStorage.removeItem(GUEST_KEY);
};

// --- Auth Endpoints ---
export const signupUser = async (
  email: string,
  password: string,
): Promise<void> => {
  const resp = await API.post("/auth/signup", { email, password });
  return resp.data;
};

export const loginUser = async (
  email: string,
  password: string,
): Promise<string> => {
  const resp = await API.post("/auth/login", { email, password });
  return resp.data.token;
};

// --- Conversation Endpoints (for authenticated usage) ---
export const getConversations = async (): Promise<IConversation[]> => {
  const resp = await API.get("/conversations");
  return resp.data;
};

export const getConversationById = async (
  id: string,
): Promise<IConversation> => {
  const resp = await API.get(`/conversations/${id}`);
  return resp.data;
};

export const createNewConversation = async (): Promise<IConversation> => {
  const resp = await API.post("/conversations");
  return resp.data;
};

export const renameConversation = async (
  id: string,
  title: string,
): Promise<IConversation> => {
  const resp = await API.put(`/conversations/${id}`, { title });
  return resp.data;
};

export const searchConversations = async (
  query: string,
): Promise<IConversation[]> => {
  const resp = await API.get(`/conversations/search/${query}`);
  return resp.data;
};

export const verifyEmail = async (
  email: string,
): Promise<{ exists: boolean }> => {
  const response = await API.get(
    `/auth/verify-email?email=${encodeURIComponent(email)}`,
  );
  return response.data;
};

export const resetPassword = async (
  email: string,
  newPassword: string,
): Promise<{ message: string }> => {
  const response = await API.post("/auth/reset-password", {
    email,
    newPassword,
  });
  return response.data;
};

export const deleteConversation = async (id: string): Promise<void> => {
  const resp = await API.delete(`/conversations/${id}`);
  return resp.data;
};

// --- Chat Endpoints ---

/**
 * Authenticated user chat:
 * POST /chat/auth
 * Expects { message, conversationId? }
 * Returns { answer, conversationId }
 */
export const sendAuthedChatMessage = async (
  message: string,
  conversationId: string | null,
) => {
  const resp = await API.post("/chat/auth", {
    message,
    conversationId,
  });
  return resp.data; // { answer, conversationId }
};

/**
 * Guest user chat (unauth):
 * POST /chat/guest
 * Expects { message, guestId? }
 * Returns { answer, guestId }
 */
export const sendGuestChatMessage = async (
  message: string,
  guestId: string | null,
) => {
  const payload: any = { message };
  if (guestId) payload.guestId = guestId;

  const resp = await API.post("/chat/guest", payload);
  return resp.data; // { answer, guestId }
};
