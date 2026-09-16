import os
import uuid

from fastapi import FastAPI, HTTPException, status, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware

from app.core_config import INTERNAL_SERVICE_TOKEN
from app.services.pdf_service import PDFService
from app.services.chunking_service import ChunkingService
from app.services.analyze_service import AnalyzeService
from app.services.review_service import ReviewService
from app.services.qa_service import QAService
from app.services.compare_service import CompareService

from app.schemas.paper_schemas import (
    APIResponse,
    FullAnalyzeDataResponse,
    ReviewDataResponse,
    QADataResponse,
    CompareDataResponse
)

# ====================================================================
# INISIALISASI APLIKASI & KEAMANAN
# ====================================================================
app = FastAPI(
    title="AI Research Paper Analysis Engine",
    description="Python FastAPI + Gemini API Service untuk Analisis Jurnal Ilmiah",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

def verify_internal_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Memverifikasi bahwa request hanya berasal dari Laravel menggunakan service token internal"""
    token = credentials.credentials
    if token != INTERNAL_SERVICE_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Token internal tidak valid."
        )


# ====================================================================
# 1. HEALTH CHECK ENDPOINT
# ====================================================================
@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy", 
        "service": "FastAPI AI Engine",
        "version": "1.0.0"
    }


# ====================================================================
# 2. ENDPOINT 1: POST /api/v1/analyze
# ====================================================================
@app.post(
    "/api/v1/analyze", 
    response_model=APIResponse[FullAnalyzeDataResponse],
    dependencies=[Depends(verify_internal_token)],
    tags=["Paper Analysis"]
)
async def analyze_paper_endpoint(
    file: UploadFile = File(...),
    request_id: str = Form(None),
    paper_id: int = Form(None)
):
    active_request_id = request_id or str(uuid.uuid4())
    
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File wajib berformat PDF!")

    try:
        pdf_bytes = await file.read()
        pages = PDFService.extract_text_with_pages(pdf_bytes)
        full_paper_text = PDFService.get_full_text(pages)
        
        # Eksekusi Analisis Lengkap
        analysis_data = AnalyzeService.run_full_analysis(full_paper_text)
        
        return APIResponse(
            success=True,
            request_id=active_request_id,
            data=analysis_data
        )

    except Exception as e:
        return APIResponse(
            success=False,
            request_id=active_request_id,
            error={
                "code": "AI_PROCESSING_FAILED",
                "message": str(e)
            }
        )


# ====================================================================
# 3. ENDPOINT 2: POST /api/v1/review
# ====================================================================
@app.post(
    "/api/v1/review", 
    response_model=APIResponse[ReviewDataResponse],
    dependencies=[Depends(verify_internal_token)],
    tags=["Peer Review"]
)
async def generate_review_endpoint(
    file: UploadFile = File(...),
    request_id: str = Form(None),
    paper_id: int = Form(None)
):
    active_request_id = request_id or str(uuid.uuid4())
    
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File wajib berformat PDF!")

    try:
        pdf_bytes = await file.read()
        pages = PDFService.extract_text_with_pages(pdf_bytes)
        full_paper_text = PDFService.get_full_text(pages)
        
        # Eksekusi Reviewer Report Komprehensif
        review_data = ReviewService.generate_review_report(full_paper_text)
        
        return APIResponse(
            success=True,
            request_id=active_request_id,
            data=review_data
        )

    except Exception as e:
        return APIResponse(
            success=False,
            request_id=active_request_id,
            error={
                "code": "AI_PROCESSING_FAILED",
                "message": str(e)
            }
        )


# ====================================================================
# 4. ENDPOINT 3: POST /api/v1/qa
# ====================================================================
@app.post(
    "/api/v1/qa", 
    response_model=APIResponse[QADataResponse],
    dependencies=[Depends(verify_internal_token)],
    tags=["Paper Q&A"]
)
async def paper_qa_endpoint(
    question: str = Form(...),
    file: UploadFile = File(None),
    paper_text: str = Form(None),
    request_id: str = Form(None),
    paper_id: int = Form(None)
):
    active_request_id = request_id or str(uuid.uuid4())

    if not file and not paper_text:
        raise HTTPException(status_code=400, detail="Wajib menyertakan file PDF atau paper_text!")

    try:
        if file:
            pdf_bytes = await file.read()
            pages = PDFService.extract_text_with_pages(pdf_bytes)
            full_text = PDFService.get_full_text(pages)
        else:
            full_text = paper_text

        # Eksekusi Q&A dengan AI
        qa_data = QAService.answer_question(full_text, question)

        return APIResponse(
            success=True,
            request_id=active_request_id,
            data=qa_data
        )

    except Exception as e:
        return APIResponse(
            success=False,
            request_id=active_request_id,
            error={
                "code": "AI_PROCESSING_FAILED",
                "message": str(e)
            }
        )


# ====================================================================
# 5. ENDPOINT 4: POST /api/v1/compare
# ====================================================================
@app.post(
    "/api/v1/compare", 
    response_model=APIResponse[CompareDataResponse],
    dependencies=[Depends(verify_internal_token)],
    tags=["Paper Comparison"]
)
async def compare_papers_endpoint(
    file_a: UploadFile = File(None),
    file_b: UploadFile = File(None),
    paper_a_text: str = Form(None),
    paper_b_text: str = Form(None),
    paper_a_title: str = Form("Paper A"),
    paper_b_title: str = Form("Paper B"),
    request_id: str = Form(None)
):
    active_request_id = request_id or str(uuid.uuid4())

    try:
        # Ekstrak Teks Paper A
        if file_a:
            pdf_bytes_a = await file_a.read()
            pages_a = PDFService.extract_text_with_pages(pdf_bytes_a)
            text_a = PDFService.get_full_text(pages_a)
            title_a = file_a.filename
        elif paper_a_text:
            text_a = paper_a_text
            title_a = paper_a_title
        else:
            raise HTTPException(status_code=400, detail="Wajib menyertakan file_a atau paper_a_text!")

        # Ekstrak Teks Paper B
        if file_b:
            pdf_bytes_b = await file_b.read()
            pages_b = PDFService.extract_text_with_pages(pdf_bytes_b)
            text_b = PDFService.get_full_text(pages_b)
            title_b = file_b.filename
        elif paper_b_text:
            text_b = paper_b_text
            title_b = paper_b_title
        else:
            raise HTTPException(status_code=400, detail="Wajib menyertakan file_b atau paper_b_text!")

        # Eksekusi Komparasi Dua Paper
        comparison_data = CompareService.compare_papers(
            paper_a_title=title_a,
            paper_a_text=text_a,
            paper_b_title=title_b,
            paper_b_text=text_b
        )

        return APIResponse(
            success=True,
            request_id=active_request_id,
            data=comparison_data
        )

    except Exception as e:
        return APIResponse(
            success=False,
            request_id=active_request_id,
            error={
                "code": "AI_PROCESSING_FAILED",
                "message": str(e)
            }
        )


# ====================================================================
# ENTRYPOINT
# ====================================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)