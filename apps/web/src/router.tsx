import { createBrowserRouter } from "react-router-dom";
import { Layout } from "@/components/Layout/Layout";
import { RequireAuth } from "@/components/RequireAuth/RequireAuth";
import { Landing } from "@/pages/Landing/Landing";
import { Search } from "@/pages/Search/Search";
import { Resume } from "@/pages/Resume/Resume";
import { Feed } from "@/pages/Feed/Feed";
import { Chat } from "@/pages/Chat/Chat";
import { CreateVacancy } from "@/pages/CreateVacancy/CreateVacancy";
import { CreatePost } from "@/pages/CreatePost/CreatePost";
import { Auth } from "@/pages/Auth/Auth";
import { MyProfile } from "@/pages/MyProfile/MyProfile";
import { EditProfile } from "@/pages/EditProfile/EditProfile";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Landing /> },
      { path: "/feed", element: <Feed /> },
      { path: "/feed/:postId", element: <Feed /> },
      { path: "/search", element: <Search /> },
      { path: "/user/:id", element: <MyProfile /> },
      { path: "/user/:id/:tab", element: <MyProfile /> },
      { path: "/user/:id/reel/:postId", element: <MyProfile /> },
      { path: "/user/:id/resume", element: <Resume /> },
      { path: "/auth", element: <Auth /> },
      {
        element: <RequireAuth />,
        children: [
          { path: "/profile", element: <MyProfile /> },
          { path: "/profile/:tab", element: <MyProfile /> },
          { path: "/profile/edit", element: <EditProfile /> },
          { path: "/chat", element: <Chat /> },
          { path: "/chat/:conversationId", element: <Chat /> },
          { path: "/create", element: <CreatePost /> },
          { path: "/vacancy/create", element: <CreateVacancy /> },
        ],
      },
    ],
  },
]);
