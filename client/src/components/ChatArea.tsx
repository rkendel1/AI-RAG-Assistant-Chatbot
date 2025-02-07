import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  useTheme,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import {
  getConversationById,
  sendChatMessage,
  createNewConversation,
  isAuthenticated,
} from "../services/api";
import { IMessage, IConversation } from "../types/conversation";
import ReactMarkdown from "react-markdown";

interface ChatAreaProps {
  conversationId: string | null;
  onNewConversation?: (conv: IConversation) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  conversationId,
  onNewConversation,
}) => {
  const theme = useTheme();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [input, setInput] = useState("");
  // loadingState is used for sending a message.
  const [loadingState, setLoadingState] = useState<
    "idle" | "processing" | "generating" | "done"
  >("idle");
  // loadingConversation is used when loading a conversation from the API.
  const [loadingConversation, setLoadingConversation] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load conversation messages when conversationId changes.
  useEffect(() => {
    if (conversationId && isAuthenticated()) {
      loadConversation(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  const loadConversation = async (id: string) => {
    try {
      setLoadingConversation(true);
      const conv = await getConversationById(id);
      setMessages(conv.messages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingConversation(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    let currentConvId = conversationId;
    try {
      // If no conversation is selected and the user is authenticated, create one automatically.
      if (!currentConvId && isAuthenticated()) {
        const newConv = await createNewConversation();
        currentConvId = newConv._id;
        if (onNewConversation) onNewConversation(newConv);
      }

      // Add the user's message.
      setLoadingState("processing");
      const userMessage: IMessage = {
        sender: "user",
        text: input,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");

      // Simulate a processing delay.
      await new Promise((res) => setTimeout(res, 500));
      setLoadingState("generating");

      // Send the message to the API.
      const resp = await sendChatMessage(input, currentConvId);

      // Append the assistant's response.
      const botMessage: IMessage = {
        sender: "assistant",
        text: resp.answer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setLoadingState("done");
    } catch (err) {
      console.error(err);
      setLoadingState("done");
    }
  };

  useEffect(() => {
    // Auto-scroll to bottom when messages update.
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Box display="flex" flexDirection="column" height="100%">
      {/* Messages Display Area */}
      <Box
        flex="1"
        overflow="auto"
        padding="1rem"
        ref={scrollRef}
        bgcolor={theme.palette.background.default}
        sx={{ transition: "background-color 0.3s ease" }}
      >
        {loadingConversation && (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            mt={2}
          >
            <CircularProgress size={24} />
            <Typography variant="caption" color="textSecondary" ml={1}>
              Loading Conversation...
            </Typography>
          </Box>
        )}

        {/* If no messages and not loading, show the placeholder */}
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
              Hello 👋 I'm Lumina - David Nguyen's personal assistant. How may I
              help you today? Send me a message to get started!
            </Typography>
          </Box>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.sender === "user";
            return (
              <Box
                key={idx}
                display="flex"
                justifyContent={isUser ? "flex-end" : "flex-start"}
                marginBottom="0.5rem"
              >
                <Box
                  borderRadius="8px"
                  padding="0.5rem 1rem"
                  bgcolor={
                    isUser
                      ? theme.palette.primary.main
                      : theme.palette.mode === "dark"
                        ? theme.palette.grey[800]
                        : "#e0e0e0"
                  }
                  color={
                    isUser
                      ? theme.palette.primary.contrastText
                      : theme.palette.text.primary
                  }
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
                  {isUser ? (
                    <Typography variant="body1">{msg.text}</Typography>
                  ) : (
                    <ReactMarkdown
                      components={{
                        li: ({ node, ...props }) => (
                          <li
                            style={{ marginBottom: "0.25rem", lineHeight: 1.5 }}
                            {...props}
                          />
                        ),
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  )}
                </Box>
              </Box>
            );
          })
        )}
        {loadingState === "processing" && (
          <Typography variant="caption" color="textSecondary">
            Processing Message...
          </Typography>
        )}
        {loadingState === "generating" && (
          <Box display="flex" alignItems="center" gap="0.5rem">
            <CircularProgress size={18} />
            <Typography variant="caption" color="textSecondary">
              Generating Response...
            </Typography>
          </Box>
        )}
      </Box>

      {/* Message Input */}
      <Box
        display="flex"
        padding="1rem"
        borderTop={`1px solid ${theme.palette.divider}`}
      >
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
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ChatArea;
