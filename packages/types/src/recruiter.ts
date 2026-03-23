import type { User } from "./user";

export interface Recruiter extends User {
  role: "recruiter";
  company: string;
  position: string;
}
