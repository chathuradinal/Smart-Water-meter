import os, sys, re, html, zipfile
from xml.sax.saxutils import escape

print("Compiling full comprehensive final report...")

# Let's define the paths
BASE_DIR = "/Users/chathurakarunarathna/Desktop/Final Project/report"
TEMPLATE_DOCX = os.path.join(BASE_DIR, "Final Report Template.docx")
OUTPUT_MD = os.path.join(BASE_DIR, "Final_Report_Compiled_KIC-BSCCSAI-251P-036.md")
OUTPUT_DOCX = os.path.join(BASE_DIR, "Final_Report_Compiled_KIC-BSCCSAI-251P-036.docx")

print(f"Base Directory: {BASE_DIR}")
print(f"Target Markdown: {OUTPUT_MD}")
print(f"Target Docx: {OUTPUT_DOCX}")
