import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AppProvider } from "./context/AppContext.jsx";
// Preserve stylesheet content and cascade order from the original pages.
import "../../css/style.css";
import "../../css/landing.css";
import "../../css/auth.css";
import "../../css/dashboard.css";
import "../../css/responsive.css";

createRoot(document.getElementById("app")).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </StrictMode>,
);
