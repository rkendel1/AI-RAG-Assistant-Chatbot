import axios from 'axios';
import { IConversation } from '../types/conversation';

// Adjust this if your server is at a different URL or port
const API = axios.create({
  baseURL: 'https://ai-assistant-chatbot-server.vercel.app/api'
});

// --- Token Handling ---
export const setTokenInLocalStorage = (token: string) => {
  localStorage.setItem('token', token);
};

export const getTokenFromLocalStorage = (): string | null => {
  return localStorage.getItem('token');
};

export const isAuthenticated = (): boolean => {
  return !!getTokenFromLocalStorage();
};

// Add an interceptor to attach token if available
API.interceptors.request.use((config) => {
  const token = getTokenFromLocalStorage();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Auth Endpoints ---
export const signupUser = async (email: string, password: string): Promise<void> => {
  const resp = await API.post('/auth/signup', { email, password });
  return resp.data;
};

export const loginUser = async (email: string, password: string): Promise<string> => {
  const resp = await API.post('/auth/login', { email, password });
  return resp.data.token;
};

// --- Conversation Endpoints ---
export const getConversations = async (): Promise<IConversation[]> => {
  const resp = await API.get('/conversations');
  return resp.data;
};

export const getConversationById = async (id: string): Promise<IConversation> => {
  const resp = await API.get(`/conversations/${id}`);
  return resp.data;
};

export const createNewConversation = async (): Promise<IConversation> => {
  const resp = await API.post('/conversations');
  return resp.data;
};

export const renameConversation = async (id: string, title: string): Promise<IConversation> => {
  const resp = await API.put(`/conversations/${id}`, { title });
  return resp.data;
};

export const searchConversations = async (query: string): Promise<IConversation[]> => {
  const resp = await API.get(`/conversations/search/${query}`);
  return resp.data;
};

export const verifyEmail = async (email: string): Promise<{ exists: boolean }> => {
  const response = await API.get(`/auth/verify-email?email=${encodeURIComponent(email)}`);
  return response.data;
};

export const resetPassword = async (email: string, newPassword: string): Promise<{ message: string }> => {
  const response = await API.post('/auth/reset-password', { email, newPassword });
  return response.data;
};

export const deleteConversation = async (id: string): Promise<void> => {
  const resp = await API.delete(`/conversations/${id}`);
  return resp.data;
}

// --- Chat Endpoint ---
export const sendChatMessage = async (message: string, conversationId: string | null) => {
  const resp = await API.post('/chat', {
    message,
    conversationId
  });
  return resp.data; // { answer: string }
};
