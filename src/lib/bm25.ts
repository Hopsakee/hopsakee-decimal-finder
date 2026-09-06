import type { Area, Category, JohnnyDecimalSystem, SearchResult } from '@/types/johnnyDecimal';

const k1 = 1.5;
const b = 0.75;

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/\s+/).filter(t => t.length > 0);
}

function getDocumentText(area: Area, category?: Category): string {
  if (category) {
    const itemNames = category.items?.map(i => i.name).join(' ') || '';
    return `${category.id} ${category.name} ${category.description} ${category.tags.join(' ')} ${itemNames} ${area.id} ${area.name} ${area.description} ${area.tags.join(' ')}`;
  }
  return `${area.id} ${area.name} ${area.description} ${area.tags.join(' ')}`;
}

interface DocEntry {
  type: 'area' | 'category';
  areaId: string;
  categoryId?: string;
  text: string;
}

function buildCorpus(system: JohnnyDecimalSystem): DocEntry[] {
  const entries: DocEntry[] = [];

  for (const area of system.areas) {
    entries.push({
      type: 'area',
      areaId: area.id,
      text: getDocumentText(area)
    });

    for (const category of area.categories) {
      entries.push({
        type: 'category',
        areaId: area.id,
        categoryId: category.id,
        text: getDocumentText(area, category)
      });
    }
  }

  return entries;
}

function calculateIDF(term: string, tokenizedDocs: string[][]): number {
  // Check for partial matches (any token containing the search term)
  const docsWithTerm = tokenizedDocs.filter(doc => doc.some(t => t.includes(term))).length;
  if (docsWithTerm === 0) return 0;
  return Math.log((tokenizedDocs.length - docsWithTerm + 0.5) / (docsWithTerm + 0.5) + 1);
}

function calculateBM25Score(
  queryTerms: string[],
  docTokens: string[],
  avgDocLength: number,
  idfScores: Map<string, number>
): { score: number; matchedTerms: string[] } {
  let score = 0;
  const matchedTerms: string[] = [];
  const docLength = docTokens.length;

  for (const term of queryTerms) {
    // Count partial matches (tokens that contain the search term)
    const matchingTokens = docTokens.filter(t => t.includes(term));
    const termFreq = matchingTokens.length;
    if (termFreq === 0) continue;

    matchedTerms.push(term);
    const idf = idfScores.get(term) || 0;
    const numerator = termFreq * (k1 + 1);
    const denominator = termFreq + k1 * (1 - b + b * (docLength / avgDocLength));
    score += idf * (numerator / denominator);
  }

  return { score, matchedTerms };
}

export function searchSystem(system: JohnnyDecimalSystem, query: string): SearchResult[] {
  if (!query.trim()) return [];

  const entries = buildCorpus(system);
  const tokenizedDocs = entries.map(e => tokenize(e.text));
  const queryTerms = tokenize(query);

  if (queryTerms.length === 0) return [];

  const avgDocLength = tokenizedDocs.reduce((sum, doc) => sum + doc.length, 0) / tokenizedDocs.length;

  const idfScores = new Map<string, number>();
  for (const term of queryTerms) {
    idfScores.set(term, calculateIDF(term, tokenizedDocs));
  }

  const scoredResults: SearchResult[] = [];

  entries.forEach((entry, idx) => {
    const { score, matchedTerms } = calculateBM25Score(
      queryTerms,
      tokenizedDocs[idx],
      avgDocLength,
      idfScores
    );

    if (score > 0) {
      const area = system.areas.find(a => a.id === entry.areaId)!;
      const category = entry.categoryId 
        ? area.categories.find(c => c.id === entry.categoryId)
        : undefined;

      scoredResults.push({
        type: entry.type,
        area,
        category,
        score,
        matchedTerms
      });
    }
  });

  return scoredResults.sort((a, b) => b.score - a.score);
}
