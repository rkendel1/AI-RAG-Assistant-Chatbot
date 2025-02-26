import React, { useState, useEffect } from "react";
import { IconButton } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import { motion } from "framer-motion";

/**
 * The CopyButton component
 *
 * @param text The text to copy
 * @constructor The CopyButton component
 */
const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  /**
   * Handle the click event
   */
  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  return (
    <motion.div whileHover={{ scale: 0.92 }} whileTap={{ scale: 0.9 }}>
      <IconButton
        size="small"
        onClick={handleClick}
        sx={{
          backgroundColor: "rgba(255,255,255,0.7)",
          "&:hover": { backgroundColor: "rgba(255,255,255,0.9)" },
        }}
      >
        {copied ? (
          <CheckIcon sx={{ fontSize: 16, color: "green" }} />
        ) : (
          <ContentCopyIcon sx={{ fontSize: 16 }} />
        )}
      </IconButton>
    </motion.div>
  );
};

export default CopyButton;
