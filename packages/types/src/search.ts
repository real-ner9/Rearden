export interface SearchQuery {
  query: string;
  filters?: SearchFilters;
}

export interface SearchFilters {
  skills?: string[];
  location?: string;
  experienceMin?: number;
  experienceMax?: number;
  availability?: string[];
}

export interface SearchResult {
  userId: string;
  score: number;
  matchReason: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  totalUsers: number;
  searchTimeMs: number;
}

// Content search (posts)
export interface PostSearchQuery {
  query: string;
  type?: "video" | "text" | "image";
  cursor?: string;
  limit?: number;
}

export interface PostSearchAuthor {
  id: string;
  name: string | null;
  username: string | null;
  title: string;
  thumbnailUrl: string | null;
}

export interface PostSearchResult {
  id: string;
  type: "text" | "image" | "video";
  content: string;
  hashtags: string[];
  imageUrl: string | null;
  imageUrls: string[];
  videoUrl: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  user: PostSearchAuthor;
}

export interface PostSearchResponse {
  posts: PostSearchResult[];
  nextCursor: string | null;
  total: number;
}

// People search
export interface PeopleSearchResult {
  id: string;
  username: string | null;
  name: string | null;
  title: string;
  thumbnailUrl: string | null;
  location: string;
}

export interface PeopleSearchResponse {
  users: PeopleSearchResult[];
  total: number;
}

// Trending
export interface TrendingHashtag {
  tag: string;
  count: number;
}

export interface TrendingResponse {
  hashtags: TrendingHashtag[];
}
