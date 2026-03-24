
from PyPDF2 import PdfReader
from pathlib import Path
import os
import re

PDF_STORAGE = Path("pdf_texts").resolve()
PDF_STORAGE.mkdir(parents=True, exist_ok=True)

def extract_first_word_from_pdf(file):
    """Extract the first word from the first page of a PDF file-like object."""
    pdf_reader = PdfReader(file)
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text() or ""
        if text:
            break
    match = re.search(r"\b(\w+)\b", text)
    if match:
        return match.group(1)
    return "document"

async def save_pdf_text(file, document_id):
    pdf_reader = PdfReader(file.file)
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text() or ""
 
    path = os.path.join(PDF_STORAGE, f"{document_id}.txt")
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    
    return text

def load_pdf_text(document_id):
    candidates = [
        PDF_STORAGE / f"{document_id}",
        PDF_STORAGE / f"{document_id}.txt",
    ]

    for path in candidates:
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                return f.read()

    return None