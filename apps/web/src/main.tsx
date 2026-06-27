import App from "@web/App.tsx";
import "@web/index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const root = document.getElementById("root");

if (root)
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
