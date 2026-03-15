#Imports 
from PyPDF2 import PdfReader
from pathlib import Path
import os

PDF_STORAGE = Path("pdf_texts").resolve() #Creating an object of Path that will point to the folder pdf_texts, .resolve() converts the relative path into an absolute path
PDF_STORAGE.mkdir(parents=True, exist_ok=True) #Ensures no error occurs if the folder doesnt exist by creating it. 

async def save_pdf_text(file, document_id):
    pdf_reader = PdfReader(file.file) #file.file gives access to the file-like object of the uploaded file. PDFReader reads the PDF content from this file-like object.
    text = "" # Initialize an empty string to store the extracted text.
    for page in pdf_reader.pages: # For each page in the PDF extract the page text and append it to the text variable.
        text += page.extract_text() or "" #Ensuring that if text extraction fails and returns None, an empty string is appended instead. Preventing errors
 
    path = os.path.join(PDF_STORAGE, f"{document_id}.txt") #Creating the full path where the text file will be saved by combining the PDF_STORAGE directory with the document_id and adding a .txt extension.
    with open(path, "w", encoding="utf-8") as f: # Open the file in write mode with UTF-8 encoding to handle various characters.
        f.write(text) # Write the extracted text to the file.
    
    return text

def load_pdf_text(document_id): # Function to load the text of a PDF document given its document_id.
    candidates = [
        PDF_STORAGE / f"{document_id}",
        PDF_STORAGE / f"{document_id}.txt",
    ]

    for path in candidates:
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                return f.read()

    return None