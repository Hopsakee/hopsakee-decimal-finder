export interface Item {
  /** Full HD id like "d1.11.01". Absent for notes without an HD suffix. */
  id?: string;
  /** Local identity for items without an id. Kept in localStorage, stripped from export and GitHub sync. */
  uid?: string;
  name: string;
}

export function itemKey(item: Item): string {
  return item.id ?? item.uid ?? item.name;
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
