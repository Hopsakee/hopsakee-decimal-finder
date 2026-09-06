export interface Item {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  tags: string[];
  items?: Item[];
}

export interface Area {
  id: string;
  name: string;
  description: string;
  tags: string[];
  categories: Category[];
}

export interface JohnnyDecimalSystem {
  name: string;
  areas: Area[];
}

export interface SearchResult {
  type: 'area' | 'category';
  area: Area;
  category?: Category;
  score: number;
  matchedTerms: string[];
}
