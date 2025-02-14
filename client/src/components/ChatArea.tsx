import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  useTheme,
  Link as MuiLink,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import {
  getConversationById,
  sendAuthedChatMessage,
  sendGuestChatMessage,
  createNewConversation,
  isAuthenticated,
  getGuestIdFromLocalStorage,
  setGuestIdInLocalStorage,
  clearGuestIdFromLocalStorage,
} from "../services/api";
import { IMessage, IConversation } from "../types/conversation";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Props:
 *  - conversationId (string | null): If authenticated and you have a known conversation _id, pass it in.
 *  - onNewConversation (function): Called if you create a brand new conversation for an authenticated user.
 */
interface ChatAreaProps {
  conversationId: string | null; // For authenticated only
  onNewConversation?: (conv: IConversation) => void;
}

/**
 * A helper function that detects plain-text URLs (like "movieverse.com" or "https://xyz")
 * and turns them into Markdown links so that ReactMarkdown will render them as clickable <a> elements.
 */
function linkifyText(text: string): string {
  // Regex that detects:
  //   1) Optional http(s)://
  //   2) Some domain (with dots)
  //   3) Optional path/query/fragment
  const urlRegex =
    /((?:https?:\/\/)?(?:[\w-]+\.)+[a-zA-Z]{2,}(?:\/[\w.,@?^=%&:/~+#-]*)?)/g;

  return text.replace(urlRegex, (match) => {
    // If it doesn't start with "http", prepend "https://"
    const hasProtocol =
      match.startsWith("http://") || match.startsWith("https://");
    const link = hasProtocol ? match : `https://${match}`;
    return `[${match}](${link})`;
  });
}

const ChatArea: React.FC<ChatAreaProps> = ({
  conversationId,
  onNewConversation,
}) => {
  const theme = useTheme();

  // Clear guestConversationId on a page reload:
  useEffect(() => {
    // Modern approach to detect reload:
    const [navEntry] = performance.getEntriesByType(
      "navigation",
    ) as PerformanceNavigationTiming[];
    if (navEntry && navEntry.type === "reload") {
      localStorage.removeItem("guestConversationId");
    }

    // For older browser support, you can fallback to:
    if (performance.navigation.type === 1) {
      localStorage.removeItem("guestConversationId");
    }
  }, []);

  // The messages to render
  const [messages, setMessages] = useState<IMessage[]>([]);
  // The user's current input
  const [input, setInput] = useState("");
  // Loading states
  const [loadingState, setLoadingState] = useState<
    "idle" | "processing" | "generating" | "done"
  >("idle");
  const [loadingConversation, setLoadingConversation] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // If we have an authenticated conversationId, load it from the server
  useEffect(() => {
    if (conversationId && isAuthenticated()) {
      loadConversation(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  // Load the existing conversation from the server
  const loadConversation = async (id: string) => {
    try {
      setLoadingConversation(true);
      const conv = await getConversationById(id);
      setMessages(conv.messages);
    } catch (err) {
      console.error("Error loading conversation:", err);
    } finally {
      setLoadingConversation(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    let currentConvId = conversationId;
    try {
      setLoadingState("processing");

      // If authenticated but no conversationId, create a new one
      if (isAuthenticated() && !currentConvId) {
        const newConv = await createNewConversation();
        currentConvId = newConv._id;
        if (onNewConversation) onNewConversation(newConv);
      }

      let guestId = getGuestIdFromLocalStorage();

      // Add the user's message to local state immediately
      const userMessage: IMessage = {
        sender: "user",
        text: input,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");

      // Simulate a short delay for UI effect
      await new Promise((res) => setTimeout(res, 500));
      setLoadingState("generating");

      let answer = "";
      let returnedId = "";

      if (isAuthenticated()) {
        // Authenticated user -> /chat/auth
        const resp = await sendAuthedChatMessage(
          userMessage.text,
          currentConvId,
        );
        answer = resp.answer;
        returnedId = resp.conversationId;
      } else {
        // Guest user -> /chat/guest
        const resp = await sendGuestChatMessage(userMessage.text, guestId);
        answer = resp.answer;
        returnedId = resp.guestId;

        // If we had no guestId, store the new one
        if (!guestId) {
          setGuestIdInLocalStorage(returnedId);
        }
      }

      // Add the AI's response
      const botMessage: IMessage = {
        sender: "assistant",
        text: answer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);

      setLoadingState("done");
    } catch (err) {
      console.error("Error sending message:", err);
      setLoadingState("done");
    }
  };

  // Auto-scroll to the bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleNewGuestConversation = () => {
    clearGuestIdFromLocalStorage();
    setMessages([]);
  };

  // A simple animated ellipsis component for "Generating Response..."
  const AnimatedEllipsis: React.FC = () => {
    return (
      <motion.span
        style={{ display: "inline-block" }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        ...
      </motion.span>
    );
  };

  // Link styling for user vs. assistant messages:
  // Because the user's bubble is bright blue, we ensure the link text is white (or close to it).
  const userLinkSx = {
    color: "#fff",
    textDecoration: "underline",
    "&:hover": {
      color: "#ddd",
      textDecoration: "underline",
    },
  };

  const assistantLinkSx = {
    color: theme.palette.mode === "dark" ? "white" : "black",
    textDecoration: "underline",
    "&:hover": {
      color: theme.palette.primary.main,
      textDecoration: "underline",
    },
  };

  return (
    <Box display="flex" flexDirection="column" height="100%">
      {/* Main chat area - displays messages */}
      <Box
        flex="1"
        overflow="auto"
        padding="1rem"
        ref={scrollRef}
        bgcolor={theme.palette.background.default}
        sx={{ transition: "background-color 0.3s ease" }}
      >
        {loadingConversation && (
          <Box display="flex" justifyContent="center" mt={2}>
            <CircularProgress size={24} />
            <Typography
              variant="caption"
              ml={1}
              sx={{ color: theme.palette.mode === "dark" ? "white" : "black" }}
            >
              Loading Conversation...
            </Typography>
          </Box>
        )}

        {/* If no messages yet, show placeholder */}
        {messages.length === 0 && !loadingConversation ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="100%"
          >
            <ChatBubbleOutlineIcon
              sx={{ fontSize: 80, color: theme.palette.text.secondary, mb: 2 }}
            />
            <Typography variant="h6" align="center" color="textSecondary">
              Hello! 👋 I'm Lumina - David Nguyen's personal assistant. Send me
              a message to get started! 🚀
            </Typography>
          </Box>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              const isUser = msg.sender === "user";
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    display: "flex",
                    justifyContent: isUser ? "flex-end" : "flex-start",
                    marginBottom: "0.5rem",
                  }}
                >
                  <Box
                    borderRadius="8px"
                    p="0.5rem 1rem"
                    bgcolor={
                      isUser
                        ? "#1976d2"
                        : theme.palette.mode === "dark"
                          ? theme.palette.grey[800]
                          : "#e0e0e0"
                    }
                    color={isUser ? "white" : theme.palette.text.primary}
                    maxWidth="60%"
                    whiteSpace="pre-wrap"
                    boxShadow={1}
                    sx={{
                      "&:hover": {
                        backgroundColor: isUser
                          ? theme.palette.primary.dark
                          : theme.palette.mode === "dark"
                            ? theme.palette.grey[700]
                            : "#d5d5d5",
                      },
                    }}
                  >
                    {/*
                      Use ReactMarkdown for all messages,
                      but apply different link styles for user vs. assistant
                    */}
                    <ReactMarkdown
                      components={{
                        a: ({ ...props }) => (
                          <MuiLink
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={isUser ? userLinkSx : assistantLinkSx}
                          />
                        ),
                      }}
                    >
                      {linkifyText(msg.text)}
                    </ReactMarkdown>
                  </Box>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {/* Show "processing" or "generating" indicator */}
        {loadingState === "processing" && (
          <Typography variant="caption" color="textSecondary">
            Processing Message...
          </Typography>
        )}
        {loadingState === "generating" && (
          <Box display="flex" alignItems="center" gap="0.5rem" mt="0.5rem">
            <CircularProgress size={18} />
            <Typography variant="caption" color="textSecondary">
              Generating Response
              <AnimatedEllipsis />
            </Typography>
          </Box>
        )}
      </Box>

      {/* Input area */}
      <Box
        display="flex"
        flexDirection="column"
        p="1rem"
        borderTop={`1px solid ${theme.palette.divider}`}
      >
        <Box display="flex">
          <TextField
            fullWidth
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: 1,
              transition: "background-color 0.3s ease",
            }}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={loadingState !== "idle" && loadingState !== "done"}
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              borderRadius: 1,
              marginLeft: "0.5rem",
              transition: "background-color 0.3s ease",
              "&:hover": {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatArea;
