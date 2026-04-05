export interface Vacancy {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: "fulltime" | "parttime" | "contract" | "freelance";
  location: string;
  createdAt: string;
}

export interface VacancyAuthor {
  id: string;
  name: string | null;
  username: string | null;
  thumbnailUrl: string | null;
  title: string;
}

export interface VacancyDetail extends Vacancy {
  author: VacancyAuthor;
}

export interface VacancySearchResult {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: "fulltime" | "parttime" | "contract" | "freelance";
  location: string;
  createdAt: string;
  author: VacancyAuthor;
}

export interface VacancySearchResponse {
  vacancies: VacancySearchResult[];
  total: number;
}
