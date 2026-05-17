export type Outcome =
  | "not_guilty"
  | "guilty"
  | "guilty_overturned"
  | "remand_for_acquittal"
  | "unclear";

export interface KeyReasoning {
  label: string;
  explanation: string;
  quote: string;
}

export interface PrecedentAnalysis {
  id: string;
  caseName: string;
  caseNumber: string;
  court: string;
  decidedAt: string;
  similarity: number;
  similarityQuote: string;
  outcome: Outcome;
  outcomeQuote: string;
  keyReasoning: KeyReasoning[];
  facts: string;
  differences: string[];
  insight: string;
}

export interface OutcomeStats {
  notGuilty: number;
  guilty: number;
  other: number;
}

export interface AnalysisReport {
  sessionId: string;
  oneLineSummary: string;
  headline: string;
  totalFound: number;
  stats: OutcomeStats;
  precedents: PrecedentAnalysis[];
  protectiveFactors: string[];
  riskFactors: string[];
  flowSummary: string;
  riskFlag: boolean;
  riskReasons: string[];
  generatedAt: string;
}
