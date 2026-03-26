export interface Post {
  id: string;
  userId: string;
  type: "text" | "image" | "video";
  content: string;
  hashtags: string[];
  imageUrl: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  crossPostInstagram: boolean;
  crossPostShorts: boolean;
  crossPostTiktok: boolean;
  createdAt: string;
}

export interface VideoPost extends Post {
  type: "video";
  videoUrl: string;
  author: {
    id: string;
    name: string;
    title: string;
    location: string;
    experience: number;
    skills: string[];
    resumeText: string | null;
  };
}

export interface CreatePostPayload {
  userId: string;
  type: "text" | "image" | "video";
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  crossPostInstagram?: boolean;
  crossPostShorts?: boolean;
  crossPostTiktok?: boolean;
}
