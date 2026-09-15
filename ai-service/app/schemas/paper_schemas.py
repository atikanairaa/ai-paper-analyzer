from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Generic, TypeVar

# ==========================================
# Amplop Respon API
# ==========================================
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
# Schema 1: Analyze Endpoint
# ==========================================
class PaperMetadata(BaseModel):
    title: str
    authors: List[str] = []
    abstract: str
    publication_year: Optional[int] = None
    journal: Optional[str] = None
    doi: Optional[str] = None
    keywords: List[str] = []

class PaperClassification(BaseModel):
    research_domain: str
    research_type: str

class SectionItem(BaseModel):
    found: bool
    summary: Optional[str] = None

class MethodologySection(SectionItem):
    type: Optional[str] = None
    method_name: Optional[str] = None
    dataset: Optional[str] = None
    sample_size: Optional[str] = None

class PaperStructure(BaseModel):
    research_problem: SectionItem
    research_question: SectionItem
    research_objective: SectionItem
    hypothesis: SectionItem
    methodology: MethodologySection
    dataset: SectionItem
    experiment: SectionItem
    results: SectionItem
    conclusion: SectionItem
    limitation: SectionItem

class ScoreDetail(BaseModel):
    score: int = Field(ge=0, le=100)
    reason: str

class PaperScoring(BaseModel):
    overall: int = Field(ge=0, le=100)
    methodology: ScoreDetail
    novelty: ScoreDetail
    clarity: ScoreDetail
    evidence: ScoreDetail
    reproducibility: ScoreDetail
    writing_quality: ScoreDetail

class FindingItem(BaseModel):
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    category: str
    finding: str
    explanation: str
    evidence: str

class CitationAnalysis(BaseModel):
    total_references: int
    recent_references: int
    old_references: int
    potential_issues: List[str] = []

class AnalyzeDataResponse(BaseModel):
    metadata: PaperMetadata
    classification: PaperClassification
    structure: PaperStructure
    scoring: PaperScoring
    findings: List[FindingItem]
    citation_analysis: CitationAnalysis
    key_findings: List[str]
    strengths: List[str]
    weaknesses: List[str]

# ==========================================
# Schema 2: Review Endpoint
# ==========================================
class ReviewDataResponse(BaseModel):
    recommendation: Literal["ACCEPT", "MINOR_REVISION", "MAJOR_REVISION", "REJECT"]
    reason: str
    summary: str
    strengths: List[str]
    major_concerns: List[str]
    minor_concerns: List[str]
    methodology_review: str
    novelty_review: str
    result_review: str
    reproducibility_review: str

# ==========================================
# Schema 3: Q&A Endpoint
# ==========================================
class EvidenceReference(BaseModel):
    page: Optional[int] = None
    section: Optional[str] = None
    snippet: Optional[str] = None

class QADataResponse(BaseModel):
    question: str
    found_in_paper: bool
    answer: str
    evidence: Optional[EvidenceReference] = None

# ==========================================
# Schema 4: Compare Endpoint
# ==========================================
class AspectComparison(BaseModel):
    aspect: str
    paper_a: str
    paper_b: str

class WinnerDetail(BaseModel):
    winner: str
    reason: str

class ComparativeAnalysis(BaseModel):
    stronger_methodology: WinnerDetail
    stronger_evidence: WinnerDetail
    more_reproducible: WinnerDetail

class CompareDataResponse(BaseModel):
    comparison_matrix: List[AspectComparison]
    comparative_analysis: ComparativeAnalysis