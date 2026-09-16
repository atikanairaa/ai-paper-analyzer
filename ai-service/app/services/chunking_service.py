from typing import List, Dict

class ChunkingService:
    @classmethod
    def chunk_by_headings(cls, structured_blocks: List[Dict], min_chars_per_chunk: int = 8000) -> List[Dict]:
        """
        Memotong paper HANYA pada Bab Utama.
        Menggabungkan sub-bab kecil agar total chunk ideal (berkisar 5 - 7 chunks).
        """
        chunks = []
        current_chunk_text = []
        current_title = "Front Matter / Metadata & Abstract"
        start_page = 1
        
        for block in structured_blocks:
            # Hanya potong jika menemukan Bab Utama DAN chunk sebelumnya sudah cukup tebal (> 8000 karakter)
            if block["is_heading"] and len(current_chunk_text) > 0:
                accumulated_text = "\n".join(current_chunk_text)
                
                if len(accumulated_text) >= min_chars_per_chunk:
                    chunks.append({
                        "chunk_id": len(chunks) + 1,
                        "section_title": current_title,
                        "page_range": f"Halaman {start_page} - {block['page']}",
                        "char_length": len(accumulated_text),
                        "text": accumulated_text
                    })
                    current_chunk_text = []
                    current_title = block["text"]
                    start_page = block["page"]

            current_chunk_text.append(f"[{block['page']}] {block['text']}")

        # Sisa bab terakhir (biasanya Conclusion & References)
        if current_chunk_text:
            accumulated_text = "\n".join(current_chunk_text)
            chunks.append({
                "chunk_id": len(chunks) + 1,
                "section_title": current_title,
                "page_range": f"Halaman {start_page} - {structured_blocks[-1]['page']}",
                "char_length": len(accumulated_text),
                "text": accumulated_text
            })

        return chunks
    
    @classmethod
    def extract_metadata_chunk(cls, pages_content: List[Dict]) -> str:
        """Mengambil teks Halaman 1 & 2 untuk diekstrak metadatanya"""
        first_pages = pages_content[:2]
        return "\n\n".join([f"=== [HALAMAN {p['page']}] ===\n{p['text']}" for p in first_pages])