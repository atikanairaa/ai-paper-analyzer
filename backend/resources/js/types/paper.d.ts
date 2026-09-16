export interface PaperMetadata {
  title: string;
  authors: string[];
  abstract: string;
  publication_year: number;
  journal: string;
  doi: string;
}

export interface PaperClassification {
  research_domain: string;
  research_type: string;
}

export interface ScoreDetail {
  score: number;
  reason: string;
}

export interface PaperScoring {
  overall: number;
  methodology: ScoreDetail;
  novelty: ScoreDetail;
  reproducibility: ScoreDetail;
}

export interface PaperFinding {
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category: string;
  finding: string;
  explanation: string;
  evidence: string;
}

export interface PaperAnalysis {
  metadata: PaperMetadata;
  classification: PaperClassification;
  scoring: PaperScoring;
  findings: PaperFinding[];
}
