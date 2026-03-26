import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SoundProvider } from "./contexts/SoundContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ChatProvider } from "./contexts/ChatContext";
import { router } from "./router";
import "./styles/global.scss";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <SoundProvider>
          <SidebarProvider>
            <NotificationProvider>
              <ChatProvider>
                <RouterProvider router={router} />
              </ChatProvider>
            </NotificationProvider>
          </SidebarProvider>
        </SoundProvider>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>
);
