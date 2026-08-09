import os
import io
import re
import logging
from pathlib import Path
from typing import Dict, Any, Optional

try:
    from pypdf import PdfReader
    HAS_PYPDF = True
except ImportError:
    PdfReader = None
    HAS_PYPDF = False

logger = logging.getLogger(__name__)


def extract_text_from_pdf_bytes(pdf_bytes: bytes, max_pages: int = 25) -> Dict[str, Any]:
    """
    Extracts text and metadata from raw PDF bytes using pypdf.
    """
    if not HAS_PYPDF or not PdfReader:
        logger.warning("⚠️ pypdf is not installed. PDF parsing skipped.")
        return {
            "page_count": 0,
            "extracted_text": "",
            "summary_preview": "PDF parser unavailable.",
        }

    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        num_pages = len(reader.pages)
        pages_to_read = min(num_pages, max_pages)

        page_texts = []
        for idx in range(pages_to_read):
            page = reader.pages[idx]
            text = page.extract_text() or ""
            clean_page_text = re.sub(r"\s+", " ", text).strip()
            if clean_page_text:
                page_texts.append(f"[Slide {idx+1}] {clean_page_text}")

        full_extracted = "\n".join(page_texts)
        summary_preview = full_extracted[:500] if full_extracted else "No extractable text found in PDF slides."

        return {
            "page_count": num_pages,
            "extracted_text": full_extracted[:15000],
            "summary_preview": summary_preview,
        }
    except Exception as e:
        logger.warning(f"⚠️ Error extracting text from PDF: {e}")
        return {
            "page_count": 0,
            "extracted_text": "",
            "summary_preview": f"PDF parsing error: {e}",
        }


def extract_text_from_pitch_deck_path(file_path: str, max_pages: int = 25) -> Dict[str, Any]:
    """
    Extracts text from a local pitch deck PDF file path.
    """
    if not file_path or not os.path.exists(file_path):
        return {
            "page_count": 0,
            "extracted_text": "",
            "summary_preview": "Pitch deck file not found.",
        }

    try:
        with open(file_path, "rb") as f:
            pdf_bytes = f.read()
            return extract_text_from_pdf_bytes(pdf_bytes, max_pages=max_pages)
    except Exception as e:
        logger.warning(f"⚠️ Failed reading pitch deck file {file_path}: {e}")
        return {
            "page_count": 0,
            "extracted_text": "",
            "summary_preview": f"Error: {e}",
        }


def resolve_local_upload_path(deck_url: str) -> Optional[str]:
    """
    Resolves a pitch_deck_url (e.g. http://localhost:8000/uploads/xyz.pdf or /uploads/xyz.pdf)
    to its local filesystem path in backend/uploads.
    """
    if not deck_url:
        return None

    filename = os.path.basename(deck_url.split("?")[0])
    if not filename:
        return None

    uploads_dir = Path(__file__).resolve().parent.parent / "uploads"
    local_path = uploads_dir / filename
    if local_path.exists():
        return str(local_path)

    return None
