// Type-only adapter for bundled, upstream OpenGrammar rules.
export interface Issue {
  type: "grammar"|"spelling"|"style"|"clarity";
  original: string;
  suggestion: string;
  reason: string;
  offset: number;
  length: number;
  id?: string;
}
