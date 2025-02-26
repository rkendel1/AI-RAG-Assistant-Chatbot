import React from "react";
import {
  Box,
  Button,
  Container,
  Fade,
  Typography,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

/**
 * The NotFoundPage component
 *
 * @constructor The NotFoundPage component
 */
const NotFoundPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Fade in timeout={600}>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // Create a subtle gradient background using the primary palette colors.
          background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.dark} 100%)`,
          p: 3,
        }}
      >
        <Container
          maxWidth="sm"
          sx={{
            textAlign: "center",
            backgroundColor: theme.palette.background.paper,
            p: 4,
            borderRadius: 2,
            boxShadow: 3,
          }}
        >
          <ErrorOutlineIcon
            sx={{
              fontSize: 100,
              color: theme.palette.error.main,
              mb: 2,
            }}
          />
          <Typography
            variant="h2"
            sx={{
              fontWeight: "bold",
              mb: 2,
              color: theme.palette.mode === "dark" ? "white" : "black",
            }}
          >
            404
          </Typography>
          <Typography
            variant="h5"
            sx={{
              mb: 3,
              color: theme.palette.mode === "dark" ? "white" : "black",
            }}
          >
            Oops! The page you're looking for doesn't exist.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate("/chat")}
            sx={{
              px: 4,
              py: 1.5,
              fontWeight: "bold",
              borderRadius: 2,
              transition: "transform 0.3s",
              "&:hover": { transform: "scale(1.05)" },
            }}
          >
            Go Back Home
          </Button>
        </Container>
      </Box>
    </Fade>
  );
};

export default NotFoundPage;
