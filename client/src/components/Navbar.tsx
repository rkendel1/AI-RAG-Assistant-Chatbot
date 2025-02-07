import React, { useState, useRef } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  InputBase,
  Box,
  Button,
  useMediaQuery,
  useTheme,
  CircularProgress,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import LogoutIcon from "@mui/icons-material/Logout";
import AddCommentIcon from "@mui/icons-material/AddComment";
import {
  createNewConversation,
  searchConversations,
  isAuthenticated,
} from "../services/api";
import { useNavigate } from "react-router-dom";
import { IConversation } from "../types/conversation";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

interface NavbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onRefreshConversations: () => void;
  onSelectConversation: (id: string | null) => void;
  onToggleTheme: () => void;
  darkMode: boolean;
  setConversations: React.Dispatch<React.SetStateAction<IConversation[]>>;
}

const Navbar: React.FC<NavbarProps> = ({
  sidebarOpen,
  onToggleSidebar,
  onRefreshConversations,
  onSelectConversation,
  onToggleTheme,
  darkMode,
  setConversations,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [newConvLoading, setNewConvLoading] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const text = "Lumina AI";
  const colors = ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#9D4EDD"];

  // A ref to store the debounce timer.
  const debounceTimerRef = useRef<number | null>(null);

  /**
   * Debounced search function to reduce API calls.
   */
  const debouncedSearch = (value: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(async () => {
      if (!value.trim()) {
        onRefreshConversations();
        setSearchLoading(false);
        return;
      }
      try {
        const results = await searchConversations(value);
        setConversations(results);
      } catch (error) {
        console.error(error);
      } finally {
        setSearchLoading(false);
      }
    }, 500);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSearchLoading(true);
    debouncedSearch(value);
  };

  /**
   * Creates a new conversation via the backend if possible.
   * If 401 is returned (user not authenticated), we still clear the local conversation,
   * allowing them to start fresh in the UI.
   */
  const handleCreateNewConversation = async () => {
    setNewConvLoading(true);
    try {
      const newConv = await createNewConversation();
      onRefreshConversations();
      onSelectConversation(newConv._id);
    } catch (error: any) {
      // If backend responds with 401 or any error, we still clear the local UI convo
      onSelectConversation(null);
      onRefreshConversations();
      // For debugging
      if (error.response && error.response.status === 401) {
        console.warn(
          "User is not authenticated, clearing conversation in UI only.",
        );
      } else {
        console.error(error);
      }

      window.location.reload();
    } finally {
      setNewConvLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Toggle Dark/Light Mode
  const handleToggleTheme = () => {
    onToggleTheme();
    localStorage.setItem("darkMode", JSON.stringify(!darkMode));
  };

  return (
    <AppBar position="static" sx={{ transition: "all 0.3s" }}>
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          boxShadow: "0px 1px 5px 0px rgba(0,0,0,0.2)",
        }}
      >
        <Box display="flex" alignItems="center" flex="1">
          {/* Sidebar Toggle */}
          <IconButton
            color="inherit"
            onClick={onToggleSidebar}
            edge="start"
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>

          {/* Dark/Light Mode Toggle */}
          <IconButton
            color="inherit"
            onClick={handleToggleTheme}
            sx={{ mr: 1 }}
          >
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>

          {/* Search Bar */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              backgroundColor: darkMode ? "grey.800" : "white",
              color: "black",
              borderRadius: 1,
              padding: 1,
              flex: 1,
              transition: "all 0.3s",
              boxShadow: "0px 1px 5px 0px rgba(0,0,0,0.2)",
            }}
          >
            <SearchIcon
              sx={{ color: darkMode ? "grey.200" : "grey.700", mr: 1 }}
            />
            <InputBase
              placeholder="Search for a Conversation..."
              sx={{
                borderRadius: 8,
                flex: 1,
                color: darkMode ? "grey.200" : "black",
              }}
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchLoading && (
              <CircularProgress size={20} color="inherit" sx={{ ml: 1 }} />
            )}
          </Box>

          {/* New Conversation Icon Button */}
          <IconButton
            sx={{ ml: 1 }}
            color="inherit"
            onClick={handleCreateNewConversation}
            title="New Conversation"
            disabled={newConvLoading}
          >
            {newConvLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <AddCommentIcon />
            )}
          </IconButton>

          {/* Login/Signup or Logout */}
          {!isAuthenticated() && (
            <>
              <Button
                onClick={() => navigate("/login")}
                color="inherit"
                sx={{ ml: 1, font: "inherit", textTransform: "none" }}
                title="Login"
              >
                LOGIN
              </Button>
              <Button
                onClick={() => navigate("/signup")}
                color="inherit"
                sx={{ ml: 1, font: "inherit", textTransform: "none" }}
                title="Sign Up"
              >
                REGISTER
              </Button>
            </>
          )}
          {isAuthenticated() && (
            <IconButton
              onClick={handleLogout}
              sx={{ ml: 1, color: "error.main" }}
            >
              <LogoutIcon />
            </IconButton>
          )}
        </Box>

        {/* Title on the Right */}
        {!isMobile && (
          <Typography
            variant="h6"
            sx={{ ml: 2, fontSize: "24px", fontWeight: "bold" }}
          >
            {text.split("").map((char, index) => {
              // Preserve spaces without applying styles
              if (char === " ") {
                return (
                  <Box key={index} component="span">
                    &nbsp;
                  </Box>
                );
              }
              const color = colors[index % colors.length];
              return (
                <Box
                  key={index}
                  component="span"
                  sx={{
                    color, // original color
                    display: "inline-block",
                    transition: "transform 0.3s ease, color 0.3s ease",
                    "&:hover": {
                      transform: "scale(1.2)",
                      color: "#e19292", // hover color (white for strong contrast)
                    },
                  }}
                >
                  {char}
                </Box>
              );
            })}
          </Typography>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
