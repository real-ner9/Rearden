export interface Post {
  id: string;
  candidateId: string;
  content: string;
  hashtags: string[];
  imageUrl: string | null;
  createdAt: string;
}
