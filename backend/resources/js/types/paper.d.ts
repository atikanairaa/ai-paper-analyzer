// ============================================================
// Tipe data yang mencerminkan schema database teman Anda
// Berdasarkan migration: create_ai_paper_system_tables.php
// ============================================================

export interface PaperAuthor {
  id: number;
  paper_id: number;
  name: string;
}

export interface PaperAnalysis {
  id: number;
  paper_id: number;
  research_domain: string;
  research_type: string;
  key_findings: string[] | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  keywords: string[] | null;
}

export interface PaperScore {
  id: number;
  paper_id: number;
  overall_score: number;
  methodology_score: number;
  methodology_reason: string;
  novelty_score: number;
  novelty_reason: string;
  clarity_score: number;
  clarity_reason: string;
  evidence_score: number;
  evidence_reason: string;
  reproducibility_score: number;
  reproducibility_reason: string;
  writing_score: number;
  writing_reason: string;
}

export interface PaperFinding {
  id?: number;
  paper_id?: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  finding: string;
  explanation: string;
  page: string | null;
  section: string | null;
  confidence: number | null;
  evidence: string;
}

export type PaperStatus = 'UPLOADED' | 'PROCESSING' | 'ANALYZED' | 'FAILED' | 'ARCHIVED';

export interface Paper {
  id: number;
  uploaded_by: number;
  title: string;
  abstract: string | null;
  publication_year: number | null;
  journal: string | null;
  doi: string | null;
  file_path: string;
  status: PaperStatus;
  is_submission: boolean;
  submission_status?: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'REVIEWED' | 'REJECTED';
  created_at: string;
  updated_at: string;
  // Relasi (eager loaded)
  authors?: PaperAuthor[];
  analyses?: PaperAnalysis[];
  scores?: PaperScore | null;
  findings?: PaperFinding[];
  latest_job?: AiJob | null;
  reviews?: Review[];
}

export interface AiJob {
  id: number;
  paper_id: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  retry_count: number;
  duration_seconds: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  paper?: Paper;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  paper_id: number | null;
  ip_address: string | null;
  created_at: string;
  user?: { id: number; name: string } | null;
  paper?: { id: number; title: string } | null;
}

export interface Review {
  id: number;
  paper_id: number;
  reviewer_id: number;
  recommendation: 'ACCEPT' | 'MINOR_REVISION' | 'MAJOR_REVISION' | 'REJECT' | null;
  score: number | null;
  comments: string | null;
  reviewer?: { id: number; name: string };
}
