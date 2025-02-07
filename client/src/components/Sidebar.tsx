import React, { useState } from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { isAuthenticated } from '../services/api';
import { IConversation } from '../types/conversation';
import { useTheme } from '@mui/material/styles';
import { renameConversation, deleteConversation } from '../services/api';

interface SidebarProps {
  open: boolean;
  conversations: IConversation[];
  onSelectConversation: (id: string) => void;
  selectedConversationId: string | null;
  onRefresh: () => void;
  isMobile: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
                                           open,
                                           conversations,
                                           onSelectConversation,
                                           selectedConversationId,
                                           onRefresh,
                                           isMobile,
                                         }) => {
  const theme = useTheme();
  const [loadingRenameId, setLoadingRenameId] = useState<string | null>(null);
  const [loadingDeleteId, setLoadingDeleteId] = useState<string | null>(null);

  // On mobile, set the sidebar to full width but below the navbar (assume navbar height = 64px)
  const widthValue = isMobile ? '100%' : '240px';
  const positionValue = isMobile ? 'absolute' : 'relative';
  const topValue = isMobile ? '64px' : 0; // adjust to match your Navbar's height
  const heightValue = isMobile ? 'calc(100vh - 64px)' : 'auto';

  const handleRename = async (convId: string, currentTitle: string) => {
    const newTitle = window.prompt('Enter new conversation name:', currentTitle);
    if (newTitle && newTitle.trim() !== '' && newTitle !== currentTitle) {
      try {
        setLoadingRenameId(convId);
        await renameConversation(convId, newTitle);
        onRefresh(); // refresh conversation list after renaming
      } catch (error) {
        console.error('Failed to rename conversation', error);
      } finally {
        setLoadingRenameId(null);
      }
    }
  };

  const handleDelete = async (convId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this conversation?');
    if (!confirmed) return;
    try {
      setLoadingDeleteId(convId);
      await deleteConversation(convId);
      onRefresh(); // refresh conversation list after deletion
    } catch (error) {
      console.error('Failed to delete conversation', error);
    } finally {
      setLoadingDeleteId(null);
    }
  };

  return (
    <Box
      sx={{
        position: positionValue,
        top: topValue,
        left: 0,
        height: heightValue,
        width: open ? widthValue : 0,
        borderRight: isMobile ? 'none' : `1px solid ${theme.palette.divider}`,
        overflowY: 'auto',
        transition: 'width 0.3s ease-in-out, left 0.3s ease-in-out',
        backgroundColor: theme.palette.background.paper,
        zIndex: isMobile ? 1200 : 'auto', // Overlay on mobile
        boxShadow: isMobile && open ? 5 : 0,
      }}
    >
      {isAuthenticated() ? (
        <List>
          {conversations.map((conv) => (
            <ListItemButton
              key={conv._id}
              selected={conv._id === selectedConversationId}
              onClick={() => onSelectConversation(conv._id)}
              sx={{ justifyContent: 'space-between' }}
            >
              <ListItemText
                primary={conv.title}
                primaryTypographyProps={{
                  noWrap: true, // This will clip the text and add ellipsis if it's too long
                  sx: {
                    color:
                      theme.palette.mode === 'dark'
                        ? theme.palette.common.white
                        : theme.palette.text.primary,
                  },
                }}
                sx={{ minWidth: 0 }} // Ensures proper shrinking in flex layout
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  edge="end"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRename(conv._id, conv.title);
                  }}
                  disabled={loadingRenameId === conv._id}
                >
                  {loadingRenameId === conv._id ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <EditIcon fontSize="small" />
                  )}
                </IconButton>
                <IconButton
                  edge="end"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(conv._id);
                  }}
                  disabled={loadingDeleteId === conv._id}
                  sx={{ color: theme.palette.error.main }}
                >
                  {loadingDeleteId === conv._id ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <DeleteIcon fontSize="small" />
                  )}
                </IconButton>
              </Box>
            </ListItemButton>
          ))}
        </List>
      ) : (
        <Box textAlign="center" padding="1rem">
          <Typography variant="body1" color="textSecondary">
            Log in to save conversation history
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Sidebar;
