import os
import uuid
from fastapi import FastAPI, HTTPException, status, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from app.core_config import INTERNAL_SERVICE_TOKEN
from app.services.pdf_service import PDFService
from app.services.chunking_service import ChunkingService
from app.services.analyze_service import AnalyzeService
from app.schemas.paper_schemas import APIResponse, FullAnalyzeDataResponse

app = FastAPI(title="AI Research Paper Analysis Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

def verify_internal_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    if token != INTERNAL_SERVICE_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Token internal tidak valid."
        )

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "FastAPI AI Engine"}

# ====================================================================
# ENDPOINT: POST /api/v1/analyze
# ====================================================================
@app.post(
    "/api/v1/analyze", 
    response_model=APIResponse[FullAnalyzeDataResponse],
    dependencies=[Depends(verify_internal_token)]
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
        
        # Eksekusi Analisis Lengkap dengan Prompt + Gemini 3.6 Flash
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

from app.services.review_service import ReviewService
from app.schemas.paper_schemas import ReviewDataResponse

# Endpoint Resmi POST /api/v1/review
@app.post(
    "/api/v1/review", 
    response_model=APIResponse[ReviewDataResponse],
    dependencies=[Depends(verify_internal_token)]
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
        
        # Eksekusi Reviewer Report
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

from app.services.qa_service import QAService
from app.schemas.paper_schemas import QADataResponse
# ====================================================================
# ENDPOINT POST /api/v1/qa
# ====================================================================
@app.post(
    "/api/v1/qa", 
    response_model=APIResponse[QADataResponse],
    dependencies=[Depends(verify_internal_token)]
)
async def paper_qa_endpoint(
    question: str = Form(...),
    file: UploadFile = File(None),
    paper_text: str = Form(None),
    request_id: str = Form(None),
    paper_id: int = Form(None)
):
    active_request_id = request_id or str(uuid.uuid4())

    # Dukung upload PDF atau kirim teks mentah
    if not file and not paper_text:
        raise HTTPException(status_code=400, detail="Wajib menyertakan file PDF atau paper_text!")

    try:
        # Jika dikirim file PDF, ekstrak dulu
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)