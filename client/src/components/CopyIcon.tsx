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
   * Handle the click event on the copy button
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
    <motion.div
      style={{
        display: "inline-flex",
        width: "fit-content",
        height: "fit-content",
      }}
      whileHover={{ scale: 1.0 }}
      whileTap={{ scale: 0.9 }}
    >
      <IconButton
        size="small"
        onClick={handleClick}
        sx={{
          fontSize: 13,
          backgroundColor: "rgba(255,255,255,0.7)",
          color: "#555",
          "&:hover": { backgroundColor: "rgba(255,255,255,0.9)" },
        }}
      >
        {copied ? (
          <CheckIcon sx={{ fontSize: 13, color: "green" }} />
        ) : (
          <ContentCopyIcon sx={{ fontSize: 13 }} />
        )}
      </IconButton>
    </motion.div>
  );
};

export default CopyButton;
