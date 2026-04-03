export interface Post {
  id: string;
  userId: string;
  type: "text" | "image" | "video";
  content: string;
  hashtags: string[];
  imageUrl: string | null;
  imageUrls: string[];
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

export interface FeedPost {
  id: string;
  type: "text" | "image" | "video";
  content: string;
  hashtags: string[];
  imageUrl: string | null;
  imageUrls: string[];
  videoUrl: string | null;
  thumbnailUrl: string | null;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    username: string | null;
    thumbnailUrl: string | null;
    title: string;
  };
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  text: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    username: string | null;
    thumbnailUrl: string | null;
  };
}

export interface CreateCommentPayload {
  text: string;
}

export interface CreatePostPayload {
  userId: string;
  type: "text" | "image" | "video";
  content: string;
  imageUrl?: string;
  imageUrls?: string[];
  videoUrl?: string;
  thumbnailUrl?: string;
  crossPostInstagram?: boolean;
  crossPostShorts?: boolean;
  crossPostTiktok?: boolean;
}
