export interface Vacancy {
  id: string;
  candidateId: string;
  title: string;
  description: string;
  type: "fulltime" | "parttime" | "contract" | "freelance";
  location: string;
  createdAt: string;
}
