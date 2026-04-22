"""
pdf_processing.py
------------------
PDF text extraction and storage utilities for the application.

This module provides functions to extract text from PDF files, save the extracted text to disk, and load it back for further processing.

Functions:
    extract_first_word_from_pdf(file): Extracts the first word from the first page of a PDF file-like object.
    save_pdf_text(file, document_id): Asynchronously extracts all text from a PDF and saves it to a text file.
    load_pdf_text(document_id): Loads the extracted text for a given document ID from disk.
"""

from PyPDF2 import PdfReader
from pathlib import Path
import os
import re

PDF_STORAGE = Path("pdf_texts").resolve()
PDF_STORAGE.mkdir(parents=True, exist_ok=True)

async def save_pdf_text(file, document_id):
    """
    Extract all text from a PDF file and save it to a text file.

    Args:
        file: An UploadFile or file-like object with a .file attribute containing the PDF data.
        document_id (str): The unique identifier for the document (used as the filename).

    Returns:
        str: The extracted text from the PDF.
    """
    try:
        pdf_reader = PdfReader(file.file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() or ""
        
        path = os.path.join(PDF_STORAGE, f"{document_id}.txt")
        with open(path, "w", encoding="utf-8") as f:
            f.write(text)
        
        return text
    except Exception as e:
        raise ValueError(f"Invalid PDF")

def load_pdf_text(document_id):
    """
    Load the extracted text for a given document ID from disk.

    Args:
        document_id (str): The unique identifier for the document.

    Returns:
        str or None: The extracted text if found, otherwise None.
    """
    candidates = [
        PDF_STORAGE / f"{document_id}",
        PDF_STORAGE / f"{document_id}.txt",
    ]

    for path in candidates:
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                return f.read()

    return None