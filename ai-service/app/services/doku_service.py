import hashlib
import hmac
import base64
import json
import time
import uuid
import urllib.request
from datetime import datetime, timezone
from fastapi import HTTPException
from app.core_config import DOKU_CLIENT_ID, DOKU_SECRET_KEY, DOKU_API_URL
from app.schemas.paper_schemas import CreateInvoiceRequest, PaymentInvoiceResponse

class DokuService:
    @classmethod
    def generate_digest(cls, body_json_str: str) -> str:
        """Menghitung SHA-256 Digest resmi dari request body"""
        hash_obj = hashlib.sha256(body_json_str.encode("utf-8"))
        return base64.b64encode(hash_obj.digest()).decode("utf-8")

    @classmethod
    def generate_signature(cls, client_id: str, request_id: str, timestamp: str, target_path: str, digest: str, secret_key: str) -> str:
        """Menghitung Signature HMAC-SHA256 sesuai Standar Resmi Dokumentasi DOKU"""
        # Komponen baku signature DOKU:
        component_signature = (
            f"Client-Id:{client_id}\n"
            f"Request-Id:{request_id}\n"
            f"Request-Timestamp:{timestamp}\n"
            f"Request-Target:{target_path}\n"
            f"Digest:{digest}"
        )
        
        hmac_obj = hmac.new(
            secret_key.encode("utf-8"),
            component_signature.encode("utf-8"),
            hashlib.sha256
        )
        signature = base64.b64encode(hmac_obj.digest()).decode("utf-8")
        return f"HMACSHA256={signature}"

    @classmethod
    def create_checkout_invoice(cls, req_data: CreateInvoiceRequest) -> PaymentInvoiceResponse:
        """
        Menembak API Resmi DOKU Sandbox untuk menghasilkan Halaman Pembayaran (Checkout URL)
        """
        if not DOKU_CLIENT_ID or not DOKU_SECRET_KEY:
            raise HTTPException(
                status_code=500,
                detail="DOKU_CLIENT_ID atau DOKU_SECRET_KEY belum diisi di file .env!"
            )

        invoice_number = f"INV-APC-{req_data.paper_id}-{int(time.time())}"
        request_id = str(uuid.uuid4())
        # Format Timestamp UTC ISO 8601 wajib DOKU
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        target_path = "/checkout/v1/payment"

        # Payload Transaksi Resmi DOKU Checkout
        payload = {
            "order": {
                "invoice_number": invoice_number,
                "amount": req_data.amount,
                "currency": "IDR",
                "callback_url": f"http://localhost:8000/papers/{req_data.paper_id}",
                "auto_redirect": True
            },
            "payment": {
                "payment_due_date": 60  # Berlaku 60 menit
            },
            "customer": {
                "id": f"AUTHOR-{req_data.paper_id}",
                "name": req_data.customer_name,
                "email": req_data.customer_email
            }
        }

        # DOKU mewajibkan JSON tanpa spasi (compact separators)
        body_str = json.dumps(payload, separators=(',', ':'))
        
        # Hitung Digest dan Signature
        digest = cls.generate_digest(body_str)
        signature = cls.generate_signature(
            DOKU_CLIENT_ID, request_id, timestamp, target_path, digest, DOKU_SECRET_KEY
        )

        headers = {
            "Client-Id": DOKU_CLIENT_ID,
            "Request-Id": request_id,
            "Request-Timestamp": timestamp,
            "Signature": signature,
            "Content-Type": "application/json"
        }

        # Tembak Server Resmi DOKU Sandbox
        url = f"{DOKU_API_URL}{target_path}"
        req = urllib.request.Request(
            url, 
            data=body_str.encode("utf-8"), 
            headers=headers, 
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                res_body = json.loads(response.read().decode("utf-8"))
                
                # Ambil URL Pembayaran Resmi dari DOKU
                payment_url = res_body.get("response", {}).get("payment", {}).get("url")
                
                if not payment_url:
                    raise HTTPException(
                        status_code=502, 
                        detail=f"DOKU tidak mengembalikan payment_url. Respon: {res_body}"
                    )

                return PaymentInvoiceResponse(
                    invoice_number=invoice_number,
                    amount=req_data.amount,
                    payment_url=payment_url,
                    status="PENDING",
                    expired_date=timestamp
                )

        except urllib.error.HTTPError as e:
            error_content = e.read().decode("utf-8")
            raise HTTPException(
                status_code=e.code,
                detail=f"DOKU API Error ({e.code}): {error_content}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Gagal menghubungi server DOKU: {str(e)}"
            )