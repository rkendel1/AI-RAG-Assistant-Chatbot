import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Fade,
  Grid,
  Grow,
  Slide,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import SecurityIcon from "@mui/icons-material/Security";

/**
 * The LandingPage component
 *
 * @constructor The LandingPage component
 */
const LandingPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // States to trigger staggered animations.
  const [showHero, setShowHero] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    // Stagger animations on mount.
    const timer1 = setTimeout(() => setShowHero(true), 300);
    const timer2 = setTimeout(() => setShowFeatures(true), 800);
    const timer3 = setTimeout(() => setShowCTA(true), 1300);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  // Reusable style for icon container inside feature cards.
  const iconContainerStyle = {
    height: 140,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      theme.palette.mode === "dark"
        ? theme.palette.grey[800]
        : theme.palette.grey[200],
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  };

  // Reusable style for each feature card with hover scaling.
  const cardStyle = {
    height: "100%",
    transition: "transform 0.3s, box-shadow 0.6s",
    "&:hover": {
      transform: "scale(1.05)", // Scale the card on hover
      boxShadow: theme.shadows[6],
    },
    borderRadius: 2,
    overflow: "hidden",
  };

  // Reusable style for animated links (hero and footer).
  const animatedLinkStyle = {
    color: "inherit",
    textDecoration: "none",
    display: "inline-block",
    transition: "transform 0.3s",
    "&:hover": {
      transform: "scale(1.05)",
      color: "primary.main",
      textDecoration: "underline",
    },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          theme.palette.mode === "dark"
            ? theme.palette.grey[900]
            : theme.palette.grey[100],
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
      }}
    >
      <Container maxWidth="lg" sx={{ pt: 6, pb: 6 }}>
        {/* Hero Section */}
        <Fade in={showHero} timeout={800}>
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Grow in={showHero} timeout={800}>
              <Typography
                variant={isMobile ? "h3" : "h2"}
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: "bold",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
                  color: theme.palette.mode === "dark" ? "white" : "black",
                  transition: "color 0.3s",
                }}
              >
                Welcome to David Nguyen's AI Assistant - Lumina!
              </Typography>
            </Grow>
            <Fade in={showHero} timeout={1200}>
              <Typography variant="h6" color="textSecondary" sx={{ mt: 2 }}>
                Chat, save conversations, and get instant information about{" "}
                <Box
                  component="a"
                  href="https://sonnguyenhoang.com"
                  sx={animatedLinkStyle}
                >
                  David Nguyen
                </Box>{" "}
                at your fingertips.
              </Typography>
            </Fade>
          </Box>
        </Fade>

        {/* Features Section */}
        <Slide direction="up" in={showFeatures} timeout={800}>
          <Box sx={{ mt: 6 }}>
            <Typography
              variant="h4"
              align="center"
              gutterBottom
              sx={{
                fontWeight: "bold",
                mb: 1,
                color: theme.palette.mode === "dark" ? "white" : "black",
              }}
            >
              What Lumina Can Do
            </Typography>
            <Typography
              variant="subtitle1"
              align="center"
              color="textSecondary"
              sx={{ mb: 4 }}
            >
              Experience personalized, secure, and lightning-fast AI assistance.
            </Typography>
            <Grid container spacing={4}>
              {/* Save Conversations Card */}
              <Grid item xs={12} sm={6} md={4}>
                <Grow in={showFeatures} timeout={900}>
                  <Card elevation={3} sx={cardStyle}>
                    <Box sx={iconContainerStyle}>
                      <ChatBubbleOutlineIcon
                        sx={{
                          fontSize: 60,
                          color: theme.palette.primary.main,
                        }}
                      />
                    </Box>
                    <CardContent>
                      <Typography gutterBottom variant="h6" component="div">
                        Save Conversations
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Create an account to save and manage your chat history.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>

              {/* Instant Responses Card */}
              <Grid item xs={12} sm={6} md={4}>
                <Grow in={showFeatures} timeout={1000}>
                  <Card elevation={3} sx={cardStyle}>
                    <Box sx={iconContainerStyle}>
                      <FlashOnIcon
                        sx={{
                          fontSize: 60,
                          color: theme.palette.primary.main,
                        }}
                      />
                    </Box>
                    <CardContent>
                      <Typography gutterBottom variant="h6" component="div">
                        Instant Responses
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Get immediate answers to your queries using advanced AI.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>

              {/* Secure & Reliable Card */}
              <Grid item xs={12} sm={6} md={4}>
                <Grow in={showFeatures} timeout={1100}>
                  <Card elevation={3} sx={cardStyle}>
                    <Box sx={iconContainerStyle}>
                      <SecurityIcon
                        sx={{
                          fontSize: 60,
                          color: theme.palette.primary.main,
                        }}
                      />
                    </Box>
                    <CardContent>
                      <Typography gutterBottom variant="h6" component="div">
                        Secure & Reliable
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Enjoy a safe environment with encrypted conversations
                        and privacy.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>
            </Grid>
          </Box>
        </Slide>

        {/* Call-to-Action Section */}
        <Fade in={showCTA} timeout={800}>
          <Box sx={{ mt: 8, textAlign: "center" }}>
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                fontWeight: "bold",
                color: theme.palette.mode === "dark" ? "white" : "black",
              }}
            >
              Get Started Now
            </Typography>
            <Typography
              variant="subtitle1"
              color="textSecondary"
              sx={{ mb: 4 }}
            >
              Create an account to save your conversations or continue as a
              guest.
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => navigate("/signup")}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontWeight: "bold",
                  borderRadius: 2,
                  transition: "transform 0.3s",
                  "&:hover": { transform: "scale(1.05)" },
                }}
              >
                Create Account
              </Button>
              <Button
                variant="outlined"
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
                Continue as Guest
              </Button>
            </Box>
          </Box>
        </Fade>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 2,
          backgroundColor: theme.palette.background.paper,
          textAlign: "center",
          mt: "auto",
        }}
      >
        <Typography variant="body1" color="textSecondary">
          © {new Date().getFullYear()}{" "}
          <Box
            component="a"
            href="https://sonnguyenhoang.com"
            sx={animatedLinkStyle}
          >
            David Nguyen's
          </Box>{" "}
          AI Assistant. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default LandingPage;
