import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

import "./index.css"; // Our global styles
import { lightTheme as theme } from "./theme";
import { ThemeProvider } from "@mui/material/styles";
import { DevSupport } from "@react-buddy/ide-toolbox";
import { ComponentPreviews, useInitial } from "./dev";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <DevSupport
          ComponentPreviews={ComponentPreviews}
          useInitialHook={useInitial}
        >
          <App />
        </DevSupport>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
