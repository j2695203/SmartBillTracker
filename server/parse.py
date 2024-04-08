# from PyPDF2 import PdfReader
from PIL import Image
import pytesseract
import re
import json
import fitz  # PyMuPDF



def extract_text_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    
    text = ''
    for page_num in range(doc.page_count):
        page = doc[page_num]
        text += page.get_text()
    
    doc.close()
    
    return text

def parse_file(pdf_path):
    pdf_text = extract_text_from_pdf(pdf_path)
    # Declare pattern
    pattern = re.compile(r"New Charges.*?four digits of card number", re.DOTALL)

    match = pattern.search(pdf_text)

    extracted_content = match.group(0)

    # Declare pattern
    pattern2 = re.compile(r"(\d{4})\n(\d+)\n(\d{2}/\d{2}/\d{2})\n(\d{2}/\d{2}/\d{2})\n(.*?)\n(.*?)\n\$(\d+\.\d{2})", re.DOTALL)

    matches2 = pattern2.findall(extracted_content)
    # Convert to JSON
    transactions = []
    for match in matches2:
        transaction = {
            "Card Number": match[0],
            "Transaction ID": match[1],
            "Transaction Date": match[2],
            "Post Date": match[3],
            "Merchant": match[4],
            "Location": match[5],
            "Amount": float(match[6])
        }
        transactions.append(transaction)

    json_data = json.dumps(transactions, indent=2)
    # print(json_data)
    return json_data

pdf_path = 'statements.pdf'
data = parse_file(pdf_path)
print(data)
