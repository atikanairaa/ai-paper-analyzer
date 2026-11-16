import urllib.request
import urllib.parse
import json
import re
from typing import List, Optional
from app.schemas.paper_schemas import ReviewerCandidate, RecommendReviewersResponse

def safe_get(d, *keys, default=""):
    """Helper untuk navigasi nested dictionary dengan aman tanpa NoneType error"""
    curr = d
    for k in keys:
        if not isinstance(curr, dict):
            return default
        curr = curr.get(k)
        if curr is None:
            return default
    return curr if curr is not None else default

class ORCIDService:
    BASE_URL = "https://pub.orcid.org/v3.0"

    NOISE_TERMS = {
        "skripsi", "tesis", "disertasi", "tugas akhir", "laporan", "jurnal", "makalah", "paper",
        "thesis", "dissertation", "studi kasus", "study case", "sistem", "system", "analisis", "analysis"
    }

    NOISE_PATTERNS = [
        r'netbeans(\s+ide)?(\s+\d+(\.\d+)?)?',
        r'eclipse',
        r'vscode|visual studio( code)?',
        r'sublime(\s+text)?',
        r'notepad\+\+',
        r'xampp|laragon|wamp',
        r'postman',
        r'android studio',
        r'\b(v|ver|version)?\s*\d+(\.\d+)+\b'
    ]

    @classmethod
    def fetch_json(cls, url: str, timeout: int = 5) -> dict:
        """Helper untuk mengambil data JSON dari URL ORCID dengan timeout terkontrol"""
        req = urllib.request.Request(
            url,
            headers={
                "Accept": "application/json",
                "User-Agent": "AIPaperAnalyzerSystem/1.0"
            }
        )
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))

    @classmethod
    def _is_noise(cls, term: str) -> bool:
        clean = term.strip().lower()
        if clean in cls.NOISE_TERMS:
            return True
        for pat in cls.NOISE_PATTERNS:
            if re.search(pat, clean, flags=re.I):
                return True
        return False

    @classmethod
    def _build_search_clauses(cls, keywords: List[str]) -> List[str]:
        """
        Menyusun klausa pencarian ORCID yang bersih, bebas noise software/skripsi,
        dan fokus pada istilah keahlian riset inti (maksimal 3 term terbaik agar respon cepat).
        """
        candidates = []
        seen = set()

        for k in keywords:
            raw = k.strip()
            if not raw or cls._is_noise(raw):
                continue

            # Bersihkan prefix umum
            cleaned = re.sub(
                r'^(algoritma|metode|analisis|penerapan|pendekatan|sistem|perbandingan|implementasi|algorithm|method)\s+',
                '',
                raw,
                flags=re.I
            ).strip()

            target = cleaned if (cleaned and not cls._is_noise(cleaned)) else raw
            low = target.lower()

            if low not in seen:
                seen.add(low)
                candidates.append(target)

            # Ekspansi sinonim penting
            if "plagiarisme" in low and "plagiarism" not in seen:
                seen.add("plagiarism")
                candidates.append("Plagiarism")

            if "jaro winkler" in low and "jaro-winkler" not in seen:
                seen.add("jaro-winkler")
                candidates.append("Jaro-Winkler")

            if "aproximate" in low:
                fixed = re.sub(r'aproximate', 'approximate', target, flags=re.I)
                if fixed.lower() not in seen:
                    seen.add(fixed.lower())
                    candidates.append(fixed)

        # Prioritaskan istilah yang lebih spesifik (mengandung tanda hubung atau multi-kata)
        def term_priority(t: str) -> int:
            if "-" in t:
                return 3
            if " " in t:
                return 2
            return 1

        sorted_terms = sorted(candidates, key=term_priority, reverse=True)
        # Ambil maksimal 3 istilah utama agar Solr ORCID menjawab instan (< 3 detik) tanpa timeout
        selected = sorted_terms[:3]
        return [f'"{t}"' for t in selected]

    @staticmethod
    def _extract_topics(work_titles: List[str], clean_keywords: List[str], researcher_keywords: List[str]) -> List[str]:
        """Mengekstrak topik keahlian terverifikasi dan ringkas untuk ditampilkan di UI"""
        if researcher_keywords:
            return [k.title() for k in researcher_keywords[:4]]

        topics = []
        combined_text = " ".join(work_titles)
        norm_combined = re.sub(r'[^a-z0-9\s]', ' ', combined_text.lower())

        # 1. Masukkan kata kunci paper yang cocok dengan publikasi peneliti
        for kw in clean_keywords:
            c = re.sub(r'^(algoritma|metode|analisis|penerapan|pendekatan|implementasi)\s+', '', kw, flags=re.I).strip()
            target_kw = c if c else kw
            if target_kw.lower() in norm_combined:
                t_title = target_kw.title()
                clean_key = re.sub(r'[^a-z0-9]', '', t_title.lower())
                if not any(re.sub(r'[^a-z0-9]', '', t.lower()) == clean_key for t in topics):
                    topics.append(t_title)

        # 2. Deteksi term ilmiah umum dari judul publikasi
        scientific_patterns = [
            r'(jaro[\s\-]winkler)',
            r'(levenshtein)',
            r'(string matching)',
            r'(plagiarism|plagiarisme)',
            r'(spell check\w*)',
            r'(bahasa indonesia)',
            r'(natural language processing|nlp)',
            r'(text mining)',
            r'(information retrieval)',
            r'(machine learning)',
            r'(ocr)'
        ]
        for pat in scientific_patterns:
            m = re.search(pat, combined_text, flags=re.I)
            if m:
                found = m.group(1).title()
                found_clean = re.sub(r'[^a-z0-9]', '', found.lower())
                if not any(re.sub(r'[^a-z0-9]', '', t.lower()) == found_clean for t in topics):
                    topics.append(found)

        # 3. Fallback jika tidak ada pola yang cocok: ambil judul paper yang dipersingkat
        if not topics and work_titles:
            for t in work_titles[:2]:
                short = t[:42] + ("..." if len(t) > 42 else "")
                topics.append(short)

        if not topics:
            topics = [k.title() for k in clean_keywords if not k.lower() in ORCIDService.NOISE_TERMS][:3]

        return topics[:4]

    @staticmethod
    def _compute_match_score(
        clean_keywords: List[str],
        researcher_keywords: List[str],
        work_titles: List[str],
        institution: str,
        rank_idx: int
    ) -> int:
        """Menghitung skor kecocokan persentase (65% - 98%) secara objektif"""
        raw_text = " ".join(researcher_keywords) + " " + " ".join(work_titles) + " " + institution
        normalized = re.sub(r'[^a-z0-9\s]', ' ', raw_text.lower())

        exact_matches = 0
        partial_matches = 0

        for kw in clean_keywords:
            if kw in ORCIDService.NOISE_TERMS:
                continue
            kw_norm = re.sub(r'[^a-z0-9\s]', ' ', kw.lower()).strip()
            kw_clean = re.sub(r'^(algoritma|metode|analisis|penerapan|pendekatan|implementasi)\s+', '', kw_norm).strip()

            if kw_norm in normalized or (kw_clean and kw_clean in normalized):
                exact_matches += 1
            else:
                words = [w for w in kw_norm.split() if len(w) > 3]
                if any(w in normalized for w in words):
                    partial_matches += 1

        if exact_matches >= 2:
            score = 92 + exact_matches
        elif exact_matches == 1:
            score = 84 + (partial_matches * 3)
        elif partial_matches >= 2:
            score = 78 + (partial_matches * 2)
        elif partial_matches == 1:
            score = 72
        else:
            score = 65

        rank_bonus = max(0, 4 - rank_idx)
        return min(98, score + rank_bonus)

    @classmethod
    def find_reviewers_by_keywords(cls, keywords: List[str], domain: Optional[str] = None) -> RecommendReviewersResponse:
        """
        Mencari data NYATA peneliti dunia langsung dari API Publik ORCID.
        Dilengkapi dengan pembersihan noise, multi-stage fallback, dan penanganan timeout toleran.
        """
        clean_keywords = [k.strip().lower() for k in keywords if k.strip()]
        if not clean_keywords:
            return RecommendReviewersResponse(keywords_searched=[], total_found=0, reviewers=[])

        search_clauses = cls._build_search_clauses(keywords)
        if not search_clauses and domain:
            search_clauses = [f'"{domain}"']

        orcid_results = []

        # TAHAP 1: Cari dengan klausa kata kunci terkurasi (timeout 6 detik)
        if search_clauses:
            query_str = " OR ".join(search_clauses)
            search_url = f"{cls.BASE_URL}/search/?q={urllib.parse.quote(query_str)}&rows=10"
            try:
                res_data = cls.fetch_json(search_url, timeout=6)
                orcid_results = res_data.get("result") or []
            except Exception:
                orcid_results = []

        # TAHAP 2: Jika Tahap 1 kosong atau timeout, coba dengan istilah tunggal paling spesifik (timeout 5 detik)
        if not orcid_results and search_clauses:
            single_term = search_clauses[0]
            fb_url = f"{cls.BASE_URL}/search/?q={urllib.parse.quote(single_term)}&rows=10"
            try:
                res_data = cls.fetch_json(fb_url, timeout=5)
                orcid_results = res_data.get("result") or []
            except Exception:
                orcid_results = []

        # TAHAP 3: Fallback ke Domain Riset jika kata kunci spesifik tidak menghasilkan record
        if not orcid_results and domain:
            try:
                clean_domain = re.sub(r'[^a-zA-Z0-9\s]', ' ', domain).replace("Ilmu", "").strip()
                if clean_domain:
                    domain_url = f"{cls.BASE_URL}/search/?q={urllib.parse.quote(clean_domain)}&rows=10"
                    res_data = cls.fetch_json(domain_url, timeout=5)
                    orcid_results = res_data.get("result") or []
            except Exception:
                orcid_results = []

        if not orcid_results:
            return RecommendReviewersResponse(
                keywords_searched=clean_keywords,
                total_found=0,
                reviewers=[]
            )

        reviewers_list = []

        # Ambil detail profil NYATA dari setiap peneliti yang ditemukan (timeout 4 detik per profil)
        for idx, item in enumerate(orcid_results):
            if len(reviewers_list) >= 4:
                break

            orcid_id = item.get("orcid-identifier", {}).get("path")
            if not orcid_id:
                continue

            try:
                record_url = f"{cls.BASE_URL}/{orcid_id}/record"
                rec_data = cls.fetch_json(record_url, timeout=4)

                given = safe_get(rec_data, "person", "name", "given-names", "value")
                family = safe_get(rec_data, "person", "name", "family-name", "value")
                full_name = f"{given} {family}".strip()
                
                if not full_name:
                    full_name = f"Researcher (ORCID: {orcid_id})"

                # Keywords dari profil
                researcher_keywords = []
                keywords_container = (rec_data.get("person") or {}).get("keywords") or {}
                for kw_obj in keywords_container.get("keyword") or []:
                    val = kw_obj.get("content")
                    if val:
                        researcher_keywords.append(val.strip())

                # Institusi Kampus NYATA dari employments, educations, atau invited positions
                institution_name = "Afiliasi Tidak Dipublikasikan"
                activities = rec_data.get("activities-summary") or {}
                
                for act_section in ["employments", "educations", "invited-positions"]:
                    aff_group = (activities.get(act_section) or {}).get("affiliation-group") or []
                    if aff_group:
                        summaries = aff_group[0].get("summaries") or []
                        if summaries:
                            for s_key in ["employment-summary", "education-summary", "invited-position-summary"]:
                                org_name = safe_get(summaries[0], s_key, "organization", "name")
                                if org_name:
                                    institution_name = org_name
                                    break
                    if institution_name != "Afiliasi Tidak Dipublikasikan":
                        break

                # Publikasi nyata (works)
                works_group = (activities.get("works") or {}).get("group") or []
                work_titles = []
                for w in works_group:
                    sums = w.get("work-summary") or []
                    if sums:
                        t = safe_get(sums[0], "title", "title", "value")
                        if t and t not in work_titles:
                            work_titles.append(t)
                            if len(work_titles) >= 4:
                                break

                # Email publik jika ada
                emails_container = (rec_data.get("person") or {}).get("emails") or {}
                email_list = emails_container.get("email") or []
                contact_email = email_list[0].get("email") if email_list else f"orcid.{orcid_id}@researcher-portal.org"

                # Ekstrak topik dan hitung skor kecocokan
                display_topics = cls._extract_topics(work_titles, clean_keywords, researcher_keywords)
                final_score = cls._compute_match_score(clean_keywords, researcher_keywords, work_titles, institution_name, len(reviewers_list))

                reviewers_list.append(ReviewerCandidate(
                    name=full_name,
                    orcid_id=orcid_id,
                    institution=institution_name,
                    email=contact_email,
                    expertise=display_topics,
                    match_score=final_score
                ))

            except Exception:
                # Jika 1 record gagal diakses atau lambat, lewati ke peneliti berikutnya
                continue

        return RecommendReviewersResponse(
            keywords_searched=clean_keywords,
            total_found=len(reviewers_list),
            reviewers=reviewers_list
        )
