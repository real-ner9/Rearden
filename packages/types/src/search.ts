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
  candidateId: string;
  score: number;
  matchReason: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  totalCandidates: number;
  searchTimeMs: number;
}
