import { createBrowserRouter } from "react-router-dom";
import { Layout } from "@/components/Layout/Layout";
import { Landing } from "@/pages/Landing/Landing";
import { Search } from "@/pages/Search/Search";
import { CandidateProfile } from "@/pages/CandidateProfile/CandidateProfile";
import { Register } from "@/pages/Register/Register";
import { Resume } from "@/pages/Resume/Resume";
import { Feed } from "@/pages/Feed/Feed";
import { Chat } from "@/pages/Chat/Chat";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Landing /> },
      { path: "/feed", element: <Feed /> },
      { path: "/search", element: <Search /> },
      { path: "/candidate/:id", element: <CandidateProfile /> },
      { path: "/candidate/:id/resume", element: <Resume /> },
      { path: "/register", element: <Register /> },
      { path: "/chat", element: <Chat /> },
      { path: "/chat/:conversationId", element: <Chat /> },
    ],
  },
]);
