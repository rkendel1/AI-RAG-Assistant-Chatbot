import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { loginUser, setTokenInLocalStorage } from "../services/api";
import { useNavigate } from "react-router-dom";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

/**
 * The Login component
 *
 * @constructor The Login component
 */
const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);

  const navigate = useNavigate();

  /**
   * Handle the login button click
   */
  const handleLogin = async () => {
    setLoadingLogin(true);
    try {
      const token = await loginUser(email, password);
      setTokenInLocalStorage(token);
      navigate("/chat");
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setLoadingLogin(false);
    }
  };

  return (
    <Box
      display="flex"
      height="100vh"
      justifyContent="center"
      alignItems="center"
      sx={{ background: "linear-gradient(to right, #00c6ff, #0072ff)" }}
    >
      <Paper style={{ padding: "2rem", maxWidth: 400, width: "100%" }}>
        <Typography
          variant="h4"
          marginBottom="1rem"
          sx={{ textAlign: "center" }}
        >
          Login
        </Typography>
        <Typography
          variant="body2"
          marginBottom="1rem"
          sx={{ textAlign: "center" }}
        >
          Login to save your chat history and continue as a registered user.
        </Typography>
        <TextField
          fullWidth
          label="Email"
          margin="normal"
          required={true}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleLogin();
            }
          }}
          disabled={loadingLogin}
        />
        <TextField
          fullWidth
          label="Password"
          margin="normal"
          required={true}
          type={showPw ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleLogin();
            }
          }}
          disabled={loadingLogin}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPw(!showPw)}
                  disabled={loadingLogin}
                >
                  {showPw ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleLogin}
          style={{ marginTop: "1rem" }}
          disabled={
            loadingLogin || email.trim() === "" || password.trim() === ""
          }
        >
          {loadingLogin ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Login"
          )}
        </Button>
        <Box marginTop="1rem">
          <Typography variant="body2">
            Don't have an account?{" "}
            <Button onClick={() => navigate("/signup")} color="primary">
              Sign Up
            </Button>
          </Typography>
          <Typography variant="body2">
            Don't want to login?{" "}
            <Button
              style={{ color: "green" }}
              onClick={() => navigate("/chat")}
            >
              Continue as Guest
            </Button>
          </Typography>
          <Typography variant="body2">
            Forgot your password?{" "}
            <Button
              style={{ color: "red" }}
              onClick={() => navigate("/forgot-password")}
            >
              Reset Password
            </Button>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
