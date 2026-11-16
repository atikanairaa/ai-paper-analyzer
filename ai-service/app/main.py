import os
import uuid
import time
import io
from fastapi.responses import StreamingResponse

from app.logger import logger
from app.services.orcid_service import ORCIDService
from app.schemas.paper_schemas import RecommendReviewersResponse

from fastapi import FastAPI, HTTPException, status, Depends, UploadFile, File, Form, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware

from app.core_config import INTERNAL_SERVICE_TOKEN
from app.services.pdf_service import PDFService
from app.services.chunking_service import ChunkingService
from app.services.analyze_service import AnalyzeService
from app.services.review_service import ReviewService
from app.services.qa_service import QAService
from app.services.compare_service import CompareService
from app.services.doku_service import DokuService

from app.schemas.paper_schemas import (
    APIResponse,
    FullAnalyzeDataResponse,
    ReviewDataResponse,
    QADataResponse,
    CompareDataResponse,
    CreateInvoiceRequest,
    PaymentInvoiceResponse
)

# ====================================================================
# APP INITIALIZATION & SECURITY
# ====================================================================
app = FastAPI(
    title="AI Research Paper Analysis Engine",
    description="Python FastAPI + Gemini API Service for Scientific Paper Analysis",
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
    """Verifies that the request originates from Laravel using the internal service token"""
    token = credentials.credentials
    if token != INTERNAL_SERVICE_TOKEN:
        logger.warn("Access denied: Invalid internal service token!")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Invalid internal service token."
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
def analyze_paper_endpoint(
    file: UploadFile = File(...),
    request_id: str = Form(None),
    paper_id: int = Form(None),
    expertises: str = Form(None),
    category: str = Form(None)
):
    active_request_id = request_id or str(uuid.uuid4())
    t_start = time.time()
    
    logger.activity_start(
        "POST /api/v1/analyze",
        {
            "Paper ID": paper_id,
            "File Name": file.filename,
            "Category": category or "Default",
            "Expertises": expertises or "-",
            "Request ID": active_request_id
        }
    )
    
    if not file.filename.endswith(".pdf"):
        err = HTTPException(status_code=400, detail="Uploaded file must be in PDF format!")
        logger.activity_failed("POST /api/v1/analyze", err, {"File Name": file.filename})
        raise err

    try:
        logger.step("PDF-READ", f"Reading uploaded file '{file.filename}'...")
        pdf_bytes = file.file.read()
        pages = PDFService.extract_text_with_pages(pdf_bytes)
        full_paper_text = PDFService.get_full_text(pages)
        
        # Execute Full Academic Analysis with Dynamic Category Rubrics
        analysis_data = AnalyzeService.run_full_analysis(full_paper_text, expertises, category)
        
        elapsed = time.time() - t_start
        logger.activity_success(
            "POST /api/v1/analyze",
            duration_sec=elapsed,
            details={
                "Paper ID": paper_id,
                "Title": analysis_data.paper.title,
                "Domain": analysis_data.paper_analyses.research_domain,
                "Type": analysis_data.paper_analyses.research_type,
                "Overall Score": f"{analysis_data.paper_scores.overall_score}/100",
                "Findings": f"{len(analysis_data.paper_findings)} issues identified"
            }
        )
        
        return APIResponse(
            success=True,
            request_id=active_request_id,
            data=analysis_data
        )

    except Exception as e:
        elapsed = time.time() - t_start
        logger.activity_failed(
            "POST /api/v1/analyze",
            e,
            details={
                "Paper ID": paper_id,
                "File Name": file.filename,
                "Category": category,
                "Elapsed Time": f"{elapsed:.2f}s",
                "Request ID": active_request_id
            }
        )
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
def generate_review_endpoint(
    file: UploadFile = File(...),
    request_id: str = Form(None),
    paper_id: int = Form(None)
):
    active_request_id = request_id or str(uuid.uuid4())
    t_start = time.time()
    
    logger.activity_start(
        "POST /api/v1/review",
        {
            "Paper ID": paper_id,
            "File Name": file.filename,
            "Request ID": active_request_id
        }
    )
    
    if not file.filename.endswith(".pdf"):
        err = HTTPException(status_code=400, detail="Uploaded file must be in PDF format!")
        logger.activity_failed("POST /api/v1/review", err, {"File Name": file.filename})
        raise err

    try:
        logger.step("PDF-READ", f"Reading uploaded file '{file.filename}'...")
        pdf_bytes = file.file.read()
        pages = PDFService.extract_text_with_pages(pdf_bytes)
        full_paper_text = PDFService.get_full_text(pages)
        
        # Execute Comprehensive Peer Review
        review_data = ReviewService.generate_review_report(full_paper_text)
        
        elapsed = time.time() - t_start
        logger.activity_success(
            "POST /api/v1/review",
            duration_sec=elapsed,
            details={
                "Paper ID": paper_id,
                "Recommendation": review_data.recommendation,
                "Verdict Reason": (review_data.recommendation_reason[:85] + "...") if len(review_data.recommendation_reason) > 85 else review_data.recommendation_reason,
                "Major Concerns": len(review_data.major_concerns),
                "Minor Concerns": len(review_data.minor_concerns)
            }
        )
        
        return APIResponse(
            success=True,
            request_id=active_request_id,
            data=review_data
        )

    except Exception as e:
        elapsed = time.time() - t_start
        logger.activity_failed(
            "POST /api/v1/review",
            e,
            details={
                "Paper ID": paper_id,
                "File Name": file.filename,
                "Elapsed Time": f"{elapsed:.2f}s",
                "Request ID": active_request_id
            }
        )
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
def paper_qa_endpoint(
    question: str = Form(...),
    file: UploadFile = File(None),
    paper_text: str = Form(None),
    request_id: str = Form(None),
    paper_id: int = Form(None)
):
    active_request_id = request_id or str(uuid.uuid4())
    t_start = time.time()
    
    logger.activity_start(
        "POST /api/v1/qa",
        {
            "Paper ID": paper_id,
            "Question": question,
            "Source": file.filename if file else f"Direct Text ({len(paper_text or ''):,} chars)",
            "Request ID": active_request_id
        }
    )

    if not file and not paper_text:
        err = HTTPException(status_code=400, detail="Either PDF file or paper_text is required!")
        logger.activity_failed("POST /api/v1/qa", err)
        raise err

    try:
        if file:
            logger.step("PDF-READ", f"Reading uploaded file '{file.filename}'...")
            pdf_bytes = file.file.read()
            pages = PDFService.extract_text_with_pages(pdf_bytes)
            full_text = PDFService.get_full_text(pages)
        else:
            full_text = paper_text

        # Execute Document Grounded Q&A
        qa_data = QAService.answer_question(full_text, question)

        elapsed = time.time() - t_start
        logger.activity_success(
            "POST /api/v1/qa",
            duration_sec=elapsed,
            details={
                "Paper ID": paper_id,
                "Found In Paper": "Yes" if qa_data.found_in_paper else "No",
                "Answer": (qa_data.answer[:85] + "...") if len(qa_data.answer) > 85 else qa_data.answer,
                "Evidence Sources": len(qa_data.evidence_sources)
            }
        )

        return APIResponse(
            success=True,
            request_id=active_request_id,
            data=qa_data
        )

    except Exception as e:
        elapsed = time.time() - t_start
        logger.activity_failed(
            "POST /api/v1/qa",
            e,
            details={
                "Paper ID": paper_id,
                "Question": question,
                "Elapsed Time": f"{elapsed:.2f}s",
                "Request ID": active_request_id
            }
        )
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
def compare_papers_endpoint(
    file_a: UploadFile = File(None),
    file_b: UploadFile = File(None),
    paper_a_text: str = Form(None),
    paper_b_text: str = Form(None),
    paper_a_title: str = Form("Paper A"),
    paper_b_title: str = Form("Paper B"),
    request_id: str = Form(None)
):
    active_request_id = request_id or str(uuid.uuid4())
    t_start = time.time()
    
    logger.activity_start(
        "POST /api/v1/compare",
        {
            "Paper A": file_a.filename if file_a else paper_a_title,
            "Paper B": file_b.filename if file_b else paper_b_title,
            "Request ID": active_request_id
        }
    )

    try:
        # Extract Paper A
        if file_a:
            logger.step("PDF-READ", f"Reading Paper A: '{file_a.filename}'...")
            pdf_bytes_a = file_a.file.read()
            pages_a = PDFService.extract_text_with_pages(pdf_bytes_a)
            text_a = PDFService.get_full_text(pages_a)
            title_a = file_a.filename
        elif paper_a_text:
            text_a = paper_a_text
            title_a = paper_a_title
        else:
            err = HTTPException(status_code=400, detail="Either file_a or paper_a_text is required!")
            logger.activity_failed("POST /api/v1/compare", err)
            raise err

        # Extract Paper B
        if file_b:
            logger.step("PDF-READ", f"Reading Paper B: '{file_b.filename}'...")
            pdf_bytes_b = file_b.file.read()
            pages_b = PDFService.extract_text_with_pages(pdf_bytes_b)
            text_b = PDFService.get_full_text(pages_b)
            title_b = file_b.filename
        elif paper_b_text:
            text_b = paper_b_text
            title_b = paper_b_title
        else:
            err = HTTPException(status_code=400, detail="Either file_b or paper_b_text is required!")
            logger.activity_failed("POST /api/v1/compare", err)
            raise err

        # Execute Comparison
        comparison_data = CompareService.compare_papers(
            paper_a_title=title_a,
            paper_a_text=text_a,
            paper_b_title=title_b,
            paper_b_text=text_b
        )

        elapsed = time.time() - t_start
        logger.activity_success(
            "POST /api/v1/compare",
            duration_sec=elapsed,
            details={
                "Methodology Winner": f"{comparison_data.verdict.stronger_methodology.winner} ({comparison_data.verdict.stronger_methodology.reason[:60]}...)",
                "Evidence Winner": f"{comparison_data.verdict.stronger_evidence.winner} ({comparison_data.verdict.stronger_evidence.reason[:60]}...)",
                "Reproducible Winner": f"{comparison_data.verdict.more_reproducible.winner} ({comparison_data.verdict.more_reproducible.reason[:60]}...)",
                "Comparison Items": len(comparison_data.comparison_table)
            }
        )

        return APIResponse(
            success=True,
            request_id=active_request_id,
            data=comparison_data
        )

    except Exception as e:
        elapsed = time.time() - t_start
        logger.activity_failed(
            "POST /api/v1/compare",
            e,
            details={
                "Elapsed Time": f"{elapsed:.2f}s",
                "Request ID": active_request_id
            }
        )
        return APIResponse(
            success=False,
            request_id=active_request_id,
            error={
                "code": "AI_PROCESSING_FAILED",
                "message": str(e)
            }
        )


# ====================================================================
# 6. ENDPOINT WATERMARK PDF (STREAMING ATTACHMENT DOWNLOAD)
# ====================================================================
@app.post(
    "/api/v1/pdf/watermark",
    responses={200: {"content": {"application/pdf": {}}}},
    dependencies=[Depends(verify_internal_token)],
    tags=["PDF Engine"]
)
async def watermark_pdf_endpoint(
    file: UploadFile = File(...),
    watermark_text: str = Form("CONFIDENTIAL - FOR PEER REVIEW ONLY")
):
    t_start = time.time()
    logger.activity_start(
        "POST /api/v1/pdf/watermark",
        {"File Name": file.filename, "Watermark Text": watermark_text}
    )

    if not file.filename.endswith(".pdf"):
        err = HTTPException(status_code=400, detail="Uploaded file must be in PDF format!")
        logger.activity_failed("POST /api/v1/pdf/watermark", err, {"File Name": file.filename})
        raise err

    try:
        pdf_bytes = await file.read()
        watermarked_pdf = PDFService.add_watermark(pdf_bytes, watermark_text)

        elapsed = time.time() - t_start
        logger.activity_success(
            "POST /api/v1/pdf/watermark",
            duration_sec=elapsed,
            details={
                "Original File": file.filename,
                "Output File": f"watermarked_{file.filename}",
                "File Size": f"{len(watermarked_pdf):,} bytes"
            }
        )

        return StreamingResponse(
            io.BytesIO(watermarked_pdf),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="watermarked_{file.filename}"'
            }
        )

    except Exception as e:
        elapsed = time.time() - t_start
        logger.activity_failed("POST /api/v1/pdf/watermark", e, {"File Name": file.filename})
        raise HTTPException(status_code=500, detail=f"Failed to watermark PDF: {str(e)}")


# ====================================================================
# 7. ENDPOINT REVIEWER: POST /api/v1/recommend-reviewers
# ====================================================================
@app.post(
    "/api/v1/recommend-reviewers",
    response_model=APIResponse[RecommendReviewersResponse],
    dependencies=[Depends(verify_internal_token)],
    tags=["Reviewer Matchmaking"]
)
async def recommend_reviewers_endpoint(
    keywords: str = Form(..., description="Comma-separated paper keywords"),
    domain: str = Form(None, description="Optional research domain")
):
    t_start = time.time()
    active_request_id = str(uuid.uuid4())
    logger.activity_start(
        "POST /api/v1/recommend-reviewers",
        {"Keywords": keywords, "Domain": domain or "-", "Request ID": active_request_id}
    )

    try:
        keyword_list = [k.strip() for k in keywords.split(",") if k.strip()]
        if not keyword_list:
            keyword_list = ["Artificial Intelligence"]

        logger.step("ORCID-SEARCH", f"Querying public reviewer records via ORCID for keywords: {keyword_list}")
        orcid_data = ORCIDService.find_reviewers_by_keywords(keyword_list, domain=domain)

        elapsed = time.time() - t_start
        logger.activity_success(
            "POST /api/v1/recommend-reviewers",
            duration_sec=elapsed,
            details={
                "Keywords Searched": ", ".join(orcid_data.keywords_searched),
                "Total Found": orcid_data.total_found
            }
        )

        return APIResponse(
            success=True,
            request_id=active_request_id,
            data=orcid_data
        )

    except Exception as e:
        elapsed = time.time() - t_start
        logger.activity_failed(
            "POST /api/v1/recommend-reviewers",
            e,
            details={"Keywords": keywords, "Elapsed Time": f"{elapsed:.2f}s"}
        )
        raise e


# ====================================================================
# 8. PAYMENT GATEWAY (DOKU)
# ====================================================================
@app.post("/api/payment/invoice", summary="Generate DOKU Payment Invoice", dependencies=[Depends(verify_internal_token)])
async def create_invoice(req: CreateInvoiceRequest):
    """
    Generate DOKU Sandbox payment URL for a given paper.
    """
    t_start = time.time()
    logger.activity_start(
        "POST /api/payment/invoice",
        {
            "Paper ID": req.paper_id,
            "Amount": f"Rp {req.amount:,}",
            "Customer": f"{req.customer_name} ({req.customer_email})"
        }
    )

    try:
        payment_data = DokuService.create_checkout_invoice(req)
        elapsed = time.time() - t_start
        logger.activity_success(
            "POST /api/payment/invoice",
            duration_sec=elapsed,
            details={
                "Invoice Number": payment_data.invoice_number,
                "Status": payment_data.status,
                "Expired Date": payment_data.expired_date
            }
        )
        return APIResponse(
            success=True,
            request_id=str(uuid.uuid4()),
            data=payment_data.model_dump()
        )
    except HTTPException as he:
        logger.activity_failed("POST /api/payment/invoice", he, {"Paper ID": req.paper_id})
        raise he
    except Exception as e:
        logger.activity_failed("POST /api/payment/invoice", e, {"Paper ID": req.paper_id})
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate DOKU invoice: {str(e)}"
        )


# ====================================================================
# ENTRYPOINT
# ====================================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
