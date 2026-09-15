import os
from fastapi import FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Research Paper Analysis Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

INTERNAL_TOKEN = os.getenv("INTERNAL_SERVICE_TOKEN", "token_rahasia_internal_tim_9921")

def verify_internal_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Header Authorization: Bearer <token> wajib ada."
        )
    token = authorization.split(" ")[1]
    if token != INTERNAL_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Token internal tidak valid."
        )

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "FastAPI AI Engine"}

@app.post("/api/v1/analyze", dependencies=[verify_internal_token])
def analyze_paper_placeholder():
    return {
        "success": True, 
        "message": "Koneksi ke FastAPI Sukses! Menunggu integrasi Gemini."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)