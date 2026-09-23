from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Generic, TypeVar

T = TypeVar("T")

class ErrorDetail(BaseModel):
    code: str
    message: str

class APIResponse(BaseModel, Generic[T]):
    success: bool
    request_id: str
    data: Optional[T] = None
    error: Optional[ErrorDetail] = None

# ==========================================
# SKEMA ENDPOINT 1: POST /api/v1/analyze
# ==========================================
class PaperMetadata(BaseModel):
    title: str
    abstract: Optional[str] = None
    publication_year: Optional[int] = None
    journal: Optional[str] = None
    doi: Optional[str] = None

class AuthorItem(BaseModel):
    name: str

class PaperAnalyses(BaseModel):
    research_domain: str
    research_type: str
    key_findings: List[str]
    strengths: List[str]
    weaknesses: List[str]
    keywords: List[str]

class SectionItem(BaseModel):
    section_name: str
    is_found: bool
    summary: Optional[str] = None

class PaperScores(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    methodology_score: int = Field(ge=0, le=100)
    methodology_reason: str
    novelty_score: int = Field(ge=0, le=100)
    novelty_reason: str
    clarity_score: int = Field(ge=0, le=100)
    clarity_reason: str
    evidence_score: int = Field(ge=0, le=100)
    evidence_reason: str
    reproducibility_score: int = Field(ge=0, le=100)
    reproducibility_reason: str
    writing_score: int = Field(ge=0, le=100)
    writing_reason: str

class FindingItem(BaseModel):
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    category: str
    finding: str
    explanation: str
    page: str
    section: str
    confidence: float
    evidence: str

class PaperReferences(BaseModel):
    total_references: int
    recent_references: int
    old_references: int
    potential_issues: List[str] = []

class ReviewItem(BaseModel):
    recommendation: Literal["ACCEPT", "MINOR_REVISION", "MAJOR_REVISION", "REJECT"]
    score: int
    comments: str

class FullAnalyzeDataResponse(BaseModel):
    paper: PaperMetadata
    authors: List[AuthorItem]
    paper_analyses: PaperAnalyses
    paper_sections: List[SectionItem]
    paper_scores: PaperScores
    paper_findings: List[FindingItem]
    paper_references: PaperReferences

AnalyzeDataResponse = FullAnalyzeDataResponse

# ==========================================
# SKEMA ENDPOINT 2: POST /api/v1/review
# ==========================================
class SectionReviews(BaseModel):
    methodology_review: str
    novelty_review: str
    result_review: str
    reproducibility_review: str

class ReviewDataResponse(BaseModel):
    summary: str
    strengths: List[str]
    major_concerns: List[str]
    minor_concerns: List[str]
    section_reviews: SectionReviews
    recommendation: Literal["ACCEPT", "MINOR_REVISION", "MAJOR_REVISION", "REJECT"]
    recommendation_reason: str

# ==========================================
# SKEMA ENDPOINT 3: POST /api/v1/qa
# ==========================================
class EvidenceSource(BaseModel):
    page: str
    section: str
    exact_quote: str

class QADataResponse(BaseModel):
    user_question: str
    found_in_paper: bool
    answer: str
    evidence_sources: List[EvidenceSource] = []

# ==========================================
# SKEMA ENDPOINT 4: POST /api/v1/compare
# ==========================================
class ComparisonTableItem(BaseModel):
    aspect: str
    paper_a: str
    paper_b: str

class VerdictDetail(BaseModel):
    question: str
    winner: str
    reason: str

class CompareVerdicts(BaseModel):
    stronger_methodology: VerdictDetail
    stronger_evidence: VerdictDetail
    more_reproducible: VerdictDetail

class CompareDataResponse(BaseModel):
    comparison_table: List[ComparisonTableItem]
    verdict: CompareVerdicts

# ==========================================
# SKEMA ENDPOINT ORCID: POST /api/v1/recommend-reviewers
# ==========================================
class ReviewerCandidate(BaseModel):
    name: str
    orcid_id: str
    institution: str
    email: str
    expertise: List[str]
    match_score: int

class RecommendReviewersResponse(BaseModel):
    keywords_searched: List[str]
    total_found: int
    reviewers: List[ReviewerCandidate]