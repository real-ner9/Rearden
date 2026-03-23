export interface User {
  id: string;
  email: string;
  name: string;
  role: "candidate" | "recruiter";
  createdAt: string;
  updatedAt: string;
}
