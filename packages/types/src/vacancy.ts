export interface Vacancy {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: "fulltime" | "parttime" | "contract" | "freelance";
  location: string;
  createdAt: string;
}
