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
# SKEMA RESMI HASIL ANALISIS
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