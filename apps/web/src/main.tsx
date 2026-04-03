import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { useAuthInit } from "./stores/authStore";
import { useChatInit } from "./stores/chatStore";
import { ChatWebSocketBridge } from "./components/ChatWebSocketBridge";
import { router } from "./router";
import "./styles/global.scss";

function AppInitializer() {
  useAuthInit();
  useChatInit();
  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppInitializer />
    <ChatWebSocketBridge />
    <RouterProvider router={router} />
  </StrictMode>
);
