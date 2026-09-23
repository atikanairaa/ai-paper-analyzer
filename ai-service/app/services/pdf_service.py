import fitz  # PyMuPDF
import re
from typing import List, Dict

class PDFService:
    @staticmethod
    def clean_text(text: str) -> str:
        text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\xff]', '', text)
        text = re.sub(r'(\w+)-\n(\w+)', r'\1\2', text)
        text = re.sub(r'[ \t]+', ' ', text)
        return text.strip()

    @classmethod
    def is_true_section_heading(cls, text: str, is_bold: bool, font_size: float, body_size: float) -> bool:
        clean = text.strip()
        if re.match(r'(?i)^(fig(\.|ure)?|table|gambar|tabel|source|sumber)\b', clean):
            return False
        if '@' in clean or 'http' in clean or len(clean) > 100 or len(clean) < 3:
            return False

        is_numbered_heading = bool(re.match(r'^([0-9]+|[IVXLCDM]+)\.?\s+[A-Z]', clean))
        academic_keywords = r'(?i)^(abstract|abstrak|introduction|pendahuluan|methodology|methods?|results?|discussion|conclusion|kesimpulan|references|daftar pustaka)$'
        is_standard_keyword = bool(re.match(academic_keywords, clean))
        is_visually_prominent = is_bold or (font_size > body_size + 1.0)
        
        return is_visually_prominent and (is_numbered_heading or is_standard_keyword)

    @classmethod
    def extract_structured_blocks(cls, pdf_bytes: bytes) -> List[Dict]:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        structured_blocks = []

        font_sizes = []
        for page in doc:
            blocks = page.get_text("dict")["blocks"]
            for b in blocks:
                if "lines" in b:
                    for line in b["lines"]:
                        for span in line["spans"]:
                            if span["text"].strip():
                                font_sizes.append(round(span["size"], 1))

        body_font_size = max(set(font_sizes), key=font_sizes.count) if font_sizes else 10.0

        for page_num in range(len(doc)):
            page = doc[page_num]
            blocks = page.get_text("dict")["blocks"]

            for b in blocks:
                if "lines" in b:
                    block_text = ""
                    is_bold = False
                    max_size = 0

                    for line in b["lines"]:
                        for span in line["spans"]:
                            block_text += span["text"] + " "
                            if (span["flags"] & 16) or ("bold" in span["font"].lower()):
                                is_bold = True
                            if span["size"] > max_size:
                                max_size = span["size"]

                    clean_b_text = cls.clean_text(block_text)
                    if clean_b_text:
                        is_heading = cls.is_true_section_heading(clean_b_text, is_bold, max_size, body_font_size)
                        structured_blocks.append({
                            "page": page_num + 1,
                            "text": clean_b_text,
                            "is_heading": is_heading,
                            "font_size": max_size,
                            "is_bold": is_bold
                        })

        doc.close()
        return structured_blocks

    @classmethod
    def extract_text_with_pages(cls, pdf_bytes: bytes) -> List[Dict]:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        pages = []
        for i in range(len(doc)):
            txt = cls.clean_text(doc[i].get_text("text"))
            if txt:
                pages.append({"page": i + 1, "text": txt})
        doc.close()
        return pages

    @classmethod
    def get_full_text(cls, pages_content: List[Dict]) -> str:
        return "\n\n".join([f"=== [HALAMAN {p['page']}] ===\n{p['text']}" for p in pages_content])

    @classmethod
    def add_watermark(cls, pdf_bytes: bytes, watermark_text: str = "CONFIDENTIAL — FOR PEER REVIEW ONLY") -> bytes:
        """
        Watermark 1 Baris Ramping (Slim & Subtle) Standar Publisher:
        - 1 Baris diagonal tunggal tepat di poros tengah
        - Font ramping (26pt) dan warna ultra-pudar (tidak menutupi tabel/teks)
        """
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")

        for page in doc:
            rect = page.rect
            center = fitz.Point(rect.width / 2, rect.height / 2)

            # 1. Warna abu-abu ultra-soft (0.91) - Sangat transparan & ramah di mata
            ghost_color = (0.91, 0.91, 0.91)
            fontname = "helv"
            fontsize = 26  # Ukuran ramping agar tidak memblokir isi tabel

            text_line = "CONFIDENTIAL — FOR PEER REVIEW ONLY"
            text_len = fitz.get_text_length(text_line, fontname=fontname, fontsize=fontsize)
            
            # Titik penempatan agar titik tengah teks presisi di titik tengah halaman
            start_point = fitz.Point(center.x - (text_len / 2), center.y + (fontsize / 3))

            # Tempel 1 baris tunggal miring diagonal (-40 derajat)
            page.insert_text(
                start_point,
                text_line,
                fontsize=fontsize,
                fontname=fontname,
                color=ghost_color,
                morph=(center, fitz.Matrix(-40)),
                overlay=True
            )

            # 2. Header Tipis di Atas Halaman
            header_text = "MANUSCRIPT UNDER PEER REVIEW — DO NOT DISTRIBUTE OR CITE"
            header_size = 8
            header_len = fitz.get_text_length(header_text, fontname=fontname, fontsize=header_size)
            header_point = fitz.Point(center.x - (header_len / 2), 22)

            page.insert_text(
                header_point,
                header_text,
                fontsize=header_size,
                fontname=fontname,
                color=(0.75, 0.75, 0.75),
                overlay=True
            )

        watermarked_bytes = doc.tobytes()
        doc.close()
        return watermarked_bytes