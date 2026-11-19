import os, sys, re, zipfile, html
from xml.sax.saxutils import escape
import xml.etree.ElementTree as ET

# Import all sections
from sec00_front_matter import FRONT_MATTER_MD
from sec01_introduction import CHAPTER_01_MD
from sec02_literature_review import CHAPTER_02_MD
from sec03_methodology import CHAPTER_03_MD
from sec04_results import CHAPTER_04_MD
from sec05_discussion import CHAPTER_05_MD
from sec06_conclusion import CHAPTER_06_MD
from sec07_references import REFERENCES_MD
from sec08_appendices import APPENDICES_MD

BASE_DIR = "/Users/chathurakarunarathna/Desktop/Final Project/report"
OUTPUT_MD = os.path.join(BASE_DIR, "Final_Report_Compiled_KIC-BSCCSAI-251P-036.md")
OUTPUT_DOCX = os.path.join(BASE_DIR, "Final_Report_Compiled_KIC-BSCCSAI-251P-036.docx")
TEMPLATE_DOCX = os.path.join(BASE_DIR, "Final Report Template.docx")

# 1. Assemble Full Markdown
full_sections = [
    FRONT_MATTER_MD,
    CHAPTER_01_MD,
    CHAPTER_02_MD,
    CHAPTER_03_MD,
    CHAPTER_04_MD,
    CHAPTER_05_MD,
    CHAPTER_06_MD,
    REFERENCES_MD,
    APPENDICES_MD
]

full_md_content = "\n\n<div style=\"page-break-after: always;\"></div>\n\n".join(full_sections)

with open(OUTPUT_MD, "w", encoding="utf-8") as f:
    f.write(full_md_content)

print(f"Successfully generated Markdown report: {OUTPUT_MD}")
print(f"Markdown file size: {len(full_md_content):,} bytes")
