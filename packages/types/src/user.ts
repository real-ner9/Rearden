export interface User {
  id: string;
  phone: string;
  username: string | null;
  onboarded: boolean;
  createdAt: string;
  updatedAt: string;

  // Profile fields
  email: string | null;
  name: string | null;
  skills: string[];
  topSkills: string[];
  experience: number;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  resumeUrl: string | null;
  resumeText: string | null;
  resume: string | null;
  location: string;
  title: string;
  bio: string;
  availability: string;

  followerCount: number;
  followingCount: number;
  isFollowing?: boolean;
}

export interface FollowUser {
  id: string;
  name: string | null;
  username: string | null;
  thumbnailUrl: string | null;
  title: string;
  isFollowing: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface SendOtpPayload {
  phone: string;
}

export interface VerifyOtpPayload {
  phone: string;
  code: string;
}

export interface CompleteAuthPayload {
  phone: string;
  code: string;
  password: string;
  username?: string;
}
