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
