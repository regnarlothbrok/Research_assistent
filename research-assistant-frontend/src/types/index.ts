export interface Paper {
  title: string;
  authors: string[];
  published: string;
  url: string;
  abstract?: string;
  file_path?: string;
}

export interface Message {
  content: string;
  sender: 'user' | 'assistant';
}

export interface SearchResponse {
  status: string;
  papers: Paper[];
  total_papers: number;
}

export interface ChatResponse {
  status: string;
  response: string;
}