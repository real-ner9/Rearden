import type { User } from "./user";

export interface Candidate extends User {
  role: "candidate";
  resume: string | null;
  skills: string[];
  experience: number;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  resumeUrl: string | null;
  resumeText: string | null;
  location: string;
  title: string;
  bio: string;
  availability: "immediate" | "2weeks" | "1month" | "3months";
}
