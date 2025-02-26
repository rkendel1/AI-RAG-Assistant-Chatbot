import React, { useState, useEffect, useRef, KeyboardEvent } from "react";
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
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
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
import CopyIcon from "./CopyIcon";

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
 *
 * @param text (string): The text to process.
 * @returns (string): The processed text with URLs turned into Markdown links.
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

// Default avatar URLs (in public folder)
const BOT_AVATAR = "/bot.jpg";
const USER_AVATAR = "/OIP5.png";

/**
 * Props for CitationBubble.
 */
interface CitationBubbleProps {
  isAboutMe: boolean;
}

/**
 * A small component to display the citation bubble.
 *
 * Uses framer-motion for appear/disappear animations.
 */
const CitationBubble: React.FC<CitationBubbleProps> = ({ isAboutMe }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Box
      sx={{ position: "absolute", bottom: "5px", right: "5px", zIndex: 10000 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* The "?" icon */}
      <Box
        sx={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          backgroundColor: "#ffd54f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          "&:hover": { backgroundColor: "#ffca28" },
        }}
      >
        <HelpOutlineIcon sx={{ fontSize: 16, color: "#000" }} />
      </Box>
      {/* AnimatePresence for the bubble on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              bottom: "100%",
              right: 0,
              marginBottom: "8px",
              backgroundColor: "#ffd54f",
              color: "#000",
              borderRadius: "8px",
              padding: "0.4rem 0.6rem",
              whiteSpace: "nowrap",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            }}
          >
            {isAboutMe ? (
              <Typography sx={{ color: "inherit" }}>
                Source:{" "}
                <MuiLink
                  href="https://sonnguyenhoang.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: "inherit",
                    textDecoration: "underline",
                    transition: "color 0.3s",
                    "&:hover": { color: "#1976d2" },
                  }}
                >
                  Son (David) Nguyen's Website
                </MuiLink>
              </Typography>
            ) : (
              <Typography sx={{ color: "inherit" }}>
                Source: General AI Knowledge
              </Typography>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

function isMessageAboutMe(text: string): boolean {
  const lower = text.toLowerCase();
  const pattern = /(?=.*\bnguyen\b)(?=.*\b(?:david|son)\b)/;
  return pattern.test(lower);
}

/**
 * The main chat area component that displays messages and handles user input.
 *
 * @param conversationId (string | null): If authenticated and you have a known conversation _id, pass it in.
 * @param onNewConversation (function): Called if you create a brand new conversation for an authenticated user.
 * @constructor The main chat area component.
 */
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
    // Fallback for older browsers:
    if (performance.navigation.type === 1) {
      localStorage.removeItem("guestConversationId");
    }
  }, []);

  // The messages to render
  const [messages, setMessages] = useState<IMessage[]>([]);

  // The user's current input
  const [input, setInput] = useState("");

  // Keep track of the user's past messages (only the text).
  const [messageHistory, setMessageHistory] = useState<string[]>([]);

  // Current position in messageHistory; -1 => we're not in history mode
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Store the user's in-progress text when they jump into history mode
  const [tempInput, setTempInput] = useState("");

  // Loading states
  const [loadingState, setLoadingState] = useState<
    "idle" | "processing" | "generating" | "done"
  >("idle");
  const [loadingConversation, setLoadingConversation] = useState(false);

  // State to control auto-scrolling. We'll only auto-scroll if the user is already near the bottom.
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  // If we have an authenticated conversationId, load it from the server
  useEffect(() => {
    if (conversationId && isAuthenticated()) {
      loadConversation(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  /**
   * Load a conversation by its ID.
   *
   * @param id The conversation ID to load.
   */
  const loadConversation = async (id: string) => {
    try {
      setLoadingConversation(true);
      const conv = await getConversationById(id);
      setMessages(conv.messages);
      console.log("Loaded conversation:", conv);
    } catch (err) {
      console.error("Error loading conversation:", err);
    } finally {
      setLoadingConversation(false);
    }
  };

  /**
   * Send the user's message to the server and receive a response.
   */
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    let currentConvId = conversationId;

    try {
      // If authenticated but no conversationId, create a new one BEFORE setting local messages
      if (isAuthenticated() && !currentConvId) {
        const newConv = await createNewConversation();
        currentConvId = newConv._id;
        if (onNewConversation) onNewConversation(newConv);
      }

      // Prepare user message
      const userMessage: IMessage = {
        sender: "user",
        text: input,
        timestamp: new Date(),
      };

      // Immediately update local state
      setMessages((prev) => [...prev, userMessage]);
      setMessageHistory((prev) => [...prev, input]);
      setHistoryIndex(-1);
      setTempInput("");
      setInput("");
      setLoadingState("processing");

      // Short delay for UI effect
      await new Promise((res) => setTimeout(res, 300));

      setLoadingState("generating");

      let guestId = getGuestIdFromLocalStorage();
      let answer = "";
      let returnedId = "";

      if (isAuthenticated()) {
        // Authenticated user -> /chat/auth
        const resp = await sendAuthedChatMessage(
          userMessage.text,
          currentConvId!,
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

      // Add the AI's response locally
      const botMessage: IMessage = {
        sender: "assistant",
        text: answer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);

      setLoadingState("done");

      // Reload the conversation from the server to ensure we display all messages from the DB
      if (currentConvId) {
        await loadConversation(currentConvId);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setLoadingState("done");
    }
  };

  /**
   * Handle keyboard events for history navigation.
   *
   * @param e The keyboard event.
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowUp") {
      if (messageHistory.length === 0) return; // no history to show
      e.preventDefault();
      // If not currently in history, store the current input into tempInput
      if (historyIndex === -1) {
        setTempInput(input);
        setHistoryIndex(messageHistory.length - 1);
        setInput(messageHistory[messageHistory.length - 1]);
      } else {
        // Move up the history if possible
        const newIndex = Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(messageHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      if (historyIndex === -1) return; // not in history, do nothing
      e.preventDefault();
      // Move down in history
      const newIndex = historyIndex + 1;
      // If we surpass the last history entry, restore tempInput
      if (newIndex > messageHistory.length - 1) {
        setHistoryIndex(-1);
        setInput(tempInput);
      } else {
        setHistoryIndex(newIndex);
        setInput(messageHistory[newIndex]);
      }
    } else if (e.key === "Enter") {
      // Preserve the existing Enter logic
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Optionally show a brief notification (not implemented here)
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  // Auto-scroll to bottom only if the user is already near the bottom.
  useEffect(() => {
    if (scrollRef.current && isAtBottom) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAtBottom]);

  /**
   * Handle starting a new conversation for a guest user.
   */
  const handleNewGuestConversation = () => {
    clearGuestIdFromLocalStorage();
    setMessages([]);
    setMessageHistory([]);
    setHistoryIndex(-1);
    setTempInput("");
  };

  /**
   * A simple component that displays an animated ellipsis.
   *
   * @constructor The animated ellipsis component.
   */
  const AnimatedEllipsis: React.FC = () => {
    const [dotCount, setDotCount] = useState(0);
    useEffect(() => {
      const interval = setInterval(() => {
        setDotCount((prev) => (prev + 1) % 4);
      }, 500);
      return () => clearInterval(interval);
    }, []);
    return <span>{".".repeat(dotCount)}</span>;
  };

  // Link styling for user vs. assistant messages:
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
    <Box
      display="flex"
      flexDirection="column"
      height="100%"
      sx={{ overflowX: "hidden" }}
    >
      {/* Main chat area - displays messages */}
      <Box
        flex="1"
        overflow="auto"
        padding="1rem"
        ref={scrollRef}
        bgcolor={theme.palette.background.default}
        sx={{ transition: "background-color 0.3s ease", overflowX: "hidden" }}
        onScroll={() => {
          if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            // Determine if user is within 50px of the bottom
            setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
          }
        }}
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
        {messages.length === 0 &&
        !loadingConversation &&
        loadingState !== "generating" &&
        loadingState !== "processing" ? (
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
              const isBot = !isUser;
              return (
                <Box
                  key={idx}
                  sx={{
                    width: "100%",
                    maxWidth: "100%",
                    display: "flex",
                    justifyContent: isUser ? "flex-end" : "flex-start",
                    mb: 1,
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      display: "flex",
                      flexDirection: isUser ? "row-reverse" : "row",
                      alignItems: "flex-start",
                    }}
                  >
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      mx={1}
                    >
                      <img
                        src={isUser ? USER_AVATAR : BOT_AVATAR}
                        alt="avatar"
                        style={{
                          borderRadius: "50%",
                          width: "40px",
                          height: "40px",
                          marginBottom: "4px",
                          transition: "transform 0.3s",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          (
                            e.currentTarget as HTMLImageElement
                          ).style.transform = "scale(1.1)";
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLImageElement
                          ).style.transform = "scale(1.0)";
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: "0.7rem",
                          opacity: 0.8,
                          transition: "color 0.3s",
                          color:
                            theme.palette.mode === "dark" ? "white" : "black",
                          "&:hover": { color: theme.palette.primary.main },
                        }}
                      >
                        {isUser ? "You" : "Lumina"}
                      </Typography>
                    </Box>
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
                      boxShadow={1}
                      sx={{
                        transition: "background-color 0.3s",
                        wordBreak: "break-word",
                        overflow: "visible",
                        "&:hover": {
                          backgroundColor: isUser
                            ? theme.palette.primary.dark
                            : theme.palette.mode === "dark"
                              ? theme.palette.grey[700]
                              : "#d5d5d5",
                        },
                        paddingTop: "1.1rem",
                        position: "relative",
                      }}
                    >
                      {/* Copy icon for bot messages */}
                      {isBot && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: 5,
                            right: 5,
                            zIndex: 2,
                          }}
                        >
                          <motion.div
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {msg.text.length > 100 ? (
                              <CopyIcon text={msg.text} />
                            ) : null}
                          </motion.div>
                        </Box>
                      )}
                      <ReactMarkdown
                        components={{
                          h1: ({ node, children, ...props }) => (
                            <Box
                              component="h1"
                              sx={{
                                fontSize: "2rem",
                                margin: "1rem 0",
                                fontWeight: "bold",
                                borderBottom: "2px solid #eee",
                                paddingBottom: "0.5rem",
                              }}
                              {...props}
                            >
                              {children}
                            </Box>
                          ),
                          h2: ({ node, children, ...props }) => (
                            <Box
                              component="h2"
                              sx={{
                                fontSize: "1.75rem",
                                margin: "1rem 0",
                                fontWeight: "bold",
                                borderBottom: "1px solid #eee",
                                paddingBottom: "0.5rem",
                              }}
                              {...props}
                            >
                              {children}
                            </Box>
                          ),
                          h3: ({ node, children, ...props }) => (
                            <Box
                              component="h3"
                              sx={{
                                fontSize: "1.5rem",
                                margin: "1rem 0",
                                fontWeight: "bold",
                              }}
                              {...props}
                            >
                              {children}
                            </Box>
                          ),
                          h4: ({ node, children, ...props }) => (
                            <Box
                              component="h4"
                              sx={{
                                fontSize: "1.25rem",
                                margin: "1rem 0",
                                fontWeight: "bold",
                              }}
                              {...props}
                            >
                              {children}
                            </Box>
                          ),
                          h5: ({ node, children, ...props }) => (
                            <Box
                              component="h5"
                              sx={{
                                fontSize: "1rem",
                                margin: "1rem 0",
                                fontWeight: "bold",
                              }}
                              {...props}
                            >
                              {children}
                            </Box>
                          ),
                          h6: ({ node, children, ...props }) => (
                            <Box
                              component="h6"
                              sx={{
                                fontSize: "0.875rem",
                                margin: "1rem 0",
                                fontWeight: "bold",
                              }}
                              {...props}
                            >
                              {children}
                            </Box>
                          ),
                          p: ({ node, children, ...props }) => (
                            <Box
                              component="p"
                              sx={{
                                margin: 0,
                                marginBottom: "0.75rem",
                                lineHeight: 1.5,
                              }}
                              {...props}
                            >
                              {children}
                            </Box>
                          ),
                          li: ({ node, children, ...props }) => (
                            <Box
                              component="li"
                              sx={{
                                margin: "0.25rem 0",
                                lineHeight: 1.4,
                                listStylePosition: "inside",
                                "& p": { margin: 0 },
                              }}
                              {...props}
                            >
                              {children}
                            </Box>
                          ),
                          a: ({ ...props }) => (
                            <MuiLink
                              {...props}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{
                                color: "inherit",
                                textDecoration: "underline",
                                "&:hover": {
                                  color: "#1976d2",
                                  cursor: "pointer",
                                },
                              }}
                            />
                          ),
                          blockquote: ({ node, children, ...props }) => (
                            <Box
                              component="blockquote"
                              sx={{
                                borderLeft: "4px solid #ddd",
                                margin: "1rem 0",
                                paddingLeft: "1rem",
                                fontStyle: "italic",
                                color: "#555",
                              }}
                              {...props}
                            >
                              {children}
                            </Box>
                          ),
                          hr: ({ node, ...props }) => (
                            <Box
                              component="hr"
                              sx={{
                                border: "none",
                                borderTop: "1px solid #eee",
                                margin: "1rem 0",
                              }}
                              {...props}
                            />
                          ),
                          code: ({
                            node,
                            inline,
                            className,
                            children,
                            ...props
                          }) => {
                            const match = /language-(\w+)/.exec(
                              className || "",
                            );
                            if (!inline && match) {
                              return (
                                <pre
                                  style={{
                                    background: "#f5f5f5",
                                    padding: "1rem",
                                    borderRadius: "4px",
                                    overflowX: "auto",
                                    margin: "1rem 0",
                                    color: "#333",
                                  }}
                                >
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                </pre>
                              );
                            } else {
                              return (
                                <code
                                  style={{
                                    background: "#f5f5f5",
                                    padding: "0.2rem 0.4rem",
                                    borderRadius: "4px",
                                    color: "#333",
                                  }}
                                  className={className}
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            }
                          },
                          pre: ({ node, children, ...props }) => (
                            <Box
                              component="pre"
                              sx={{
                                background: "#f5f5f5",
                                padding: "1rem",
                                borderRadius: "4px",
                                overflowX: "auto",
                                margin: "1rem 0",
                              }}
                              {...props}
                            >
                              {children}
                            </Box>
                          ),
                          table: ({ node, children, ...props }) => (
                            <Box
                              component="table"
                              sx={{
                                width: "100%",
                                borderCollapse: "collapse",
                                marginBottom: "1rem",
                                overflowX: "auto",
                                display: "block",
                              }}
                              {...props}
                            >
                              {children}
                            </Box>
                          ),
                          thead: ({ node, children, ...props }) => (
                            <Box component="thead" {...props}>
                              {children}
                            </Box>
                          ),
                          tbody: ({ node, children, ...props }) => (
                            <Box component="tbody" {...props}>
                              {children}
                            </Box>
                          ),
                          th: ({ node, children, ...props }) => (
                            <Box
                              component="th"
                              sx={{
                                border: "1px solid #ddd",
                                padding: "0.5rem",
                                backgroundColor: "#f5f5f5",
                              }}
                              {...props}
                            >
                              {children}
                            </Box>
                          ),
                          td: ({ node, children, ...props }) => (
                            <Box
                              component="td"
                              sx={{
                                border: "1px solid #ddd",
                                padding: "0.5rem",
                              }}
                              {...props}
                            >
                              {children}
                            </Box>
                          ),
                        }}
                      >
                        {linkifyText(msg.text)}
                      </ReactMarkdown>
                      {isBot && (
                        <CitationBubble
                          isAboutMe={isMessageAboutMe(msg.text)}
                        />
                      )}
                    </Box>
                  </motion.div>
                </Box>
              );
            })}
          </AnimatePresence>
        )}

        {/* Show "processing" or "generating" indicator */}
        {loadingState === "processing" && (
          <Box display="flex" alignItems="center" gap="0.5rem" mt="0.5rem">
            <CircularProgress size={18} />
            <Typography variant="caption" color="textSecondary">
              Processing Message
              <AnimatedEllipsis />
            </Typography>
          </Box>
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
            onKeyDown={handleKeyDown}
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
              "&:hover": { backgroundColor: theme.palette.primary.dark },
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
