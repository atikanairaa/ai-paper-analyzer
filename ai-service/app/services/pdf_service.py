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