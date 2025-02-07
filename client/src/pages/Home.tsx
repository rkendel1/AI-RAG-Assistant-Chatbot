import React, { useState, useEffect } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import { getConversations, isAuthenticated } from "../services/api";
import { IConversation } from "../types/conversation";

interface HomeProps {
  onToggleTheme: () => void;
  darkMode: boolean;
}

const Home: React.FC<HomeProps> = ({ onToggleTheme, darkMode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    // On mobile, default the sidebar to closed; on desktop open it.
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const loadConversations = async () => {
    try {
      if (isAuthenticated()) {
        const resp = await getConversations();
        setConversations(resp);
      } else {
        setConversations([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Updated to accept string | null
  const handleSelectConversation = (id: string | null) => {
    setSelectedConversationId(id);
  };

  // Callback when a new conversation is created (either automatically or via the new convo button)
  const handleNewConversation = (conv: IConversation) => {
    setSelectedConversationId(conv._id);
    loadConversations();
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100vh"
      bgcolor={theme.palette.background.default}
      sx={{ transition: "background-color 0.3s ease" }}
    >
      <Navbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
        onRefreshConversations={loadConversations}
        onSelectConversation={handleSelectConversation}
        onToggleTheme={onToggleTheme}
        darkMode={darkMode}
        setConversations={setConversations} // For live search
      />
      <Box display="flex" flex="1" overflow="hidden">
        <Sidebar
          open={sidebarOpen}
          conversations={conversations}
          onSelectConversation={handleSelectConversation}
          selectedConversationId={selectedConversationId}
          onRefresh={loadConversations}
          isMobile={isMobile}
        />
        <Box flex="1">
          <ChatArea
            conversationId={selectedConversationId}
            onNewConversation={handleNewConversation}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Home;
