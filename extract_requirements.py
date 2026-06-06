import sys
from pathlib import Path
from PyPDF2 import PdfReader

pdf_path = Path('solar-care-mobile-app/PROJECT REQUIREMENT DOCUMENT.pdf')
output_path = Path('solar-care-mobile-app/PROJECT_REQUIREMENT_DOCUMENT.txt')

if not pdf_path.is_file():
    print(f'PDF not found: {pdf_path}', file=sys.stderr)
    sys.exit(1)

reader = PdfReader(str(pdf_path))
text_pages = []
for page_num, page in enumerate(reader.pages, start=1):
    try:
        text_pages.append(page.extract_text() or '')
    except Exception as e:
        print(f'Error extracting page {page_num}: {e}', file=sys.stderr)

full_text = "\n\n--- Page Break ---\n\n".join(text_pages)
output_path.write_text(full_text, encoding='utf-8')
print(f'Extracted text written to {output_path}')
