import os, sys, re, zipfile, html
from xml.sax.saxutils import escape
import xml.etree.ElementTree as ET

BASE_DIR = "/Users/chathurakarunarathna/Desktop/Final Project/report"
OUTPUT_MD = os.path.join(BASE_DIR, "Final_Report_Compiled_KIC-BSCCSAI-251P-036.md")
OUTPUT_DOCX = os.path.join(BASE_DIR, "Final_Report_Compiled_KIC-BSCCSAI-251P-036.docx")
TEMPLATE_DOCX = os.path.join(BASE_DIR, "Final Report Template.docx")

with open(OUTPUT_MD, "r", encoding="utf-8") as f:
    md_text = f.read()

# Load template docx archive
with zipfile.ZipFile(TEMPLATE_DOCX, 'r') as z:
    file_map = {name: z.read(name) for name in z.namelist()}
    orig_doc_xml = z.read('word/document.xml').decode('utf-8')

root_match = re.search(r'(<w:document\b[^>]*>.*?<w:body>)', orig_doc_xml, re.DOTALL)
doc_start = root_match.group(1)

sect_match = re.search(r'(<w:sectPr\b.*?</w:sectPr>)', orig_doc_xml, re.DOTALL)
sect_pr = sect_match.group(1)

def clean_xml(s):
    # Remove XML 1.0 invalid control characters
    return re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', s)

# Helper function to generate XML runs from formatted markdown text
def make_runs(text):
    text = clean_xml(text)
    token_pattern = re.compile(r'(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)')
    parts = token_pattern.split(text)
    runs_xml = []
    for part in parts:
        if not part:
            continue
        if part.startswith('**') and part.endswith('**') and len(part) >= 4:
            content = escape(part[2:-2])
            runs_xml.append(f'<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">{content}</w:t></w:r>')
        elif part.startswith('*') and part.endswith('*') and len(part) >= 2:
            content = escape(part[1:-1])
            runs_xml.append(f'<w:r><w:rPr><w:i/></w:rPr><w:t xml:space="preserve">{content}</w:t></w:r>')
        elif part.startswith('`') and part.endswith('`') and len(part) >= 2:
            content = escape(part[1:-1])
            runs_xml.append(f'<w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr><w:t xml:space="preserve">{content}</w:t></w:r>')
        else:
            content = escape(part)
            runs_xml.append(f'<w:r><w:t xml:space="preserve">{content}</w:t></w:r>')
    return "".join(runs_xml)

def make_p(runs_xml, style=None, page_break_before=False, center=False):
    p_pr = []
    if style:
        p_pr.append(f'<w:pStyle w:val="{style}"/>')
    if page_break_before:
        p_pr.append('<w:pageBreakBefore/>')
    if center:
        p_pr.append('<w:jc w:val="center"/>')
    p_pr_xml = f'<w:pPr>{"".join(p_pr)}</w:pPr>' if p_pr else ''
    return f'<w:p>{p_pr_xml}{runs_xml}</w:p>'

def make_page_break():
    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'

def make_table(rows):
    if not rows:
        return ""
    col_count = max(len(r) for r in rows)
    total_w = 8220
    col_w = total_w // col_count
    
    xml = ['<w:tbl>',
           '<w:tblPr>',
           '<w:tblStyle w:val="TableGrid"/>',
           '<w:tblW w:w="0" w:type="auto"/>',
           '<w:tblBorders>',
           '<w:top w:val="single" w:sz="6" w:space="0" w:color="003366"/>',
           '<w:bottom w:val="single" w:sz="6" w:space="0" w:color="003366"/>',
           '<w:left w:val="none"/>',
           '<w:right w:val="none"/>',
           '<w:insideH w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>',
           '<w:insideV w:val="none"/>',
           '</w:tblBorders>',
           '<w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="0" w:noVBand="0"/>',
           '</w:tblPr>',
           '<w:tblGrid>']
    for _ in range(col_count):
        xml.append(f'<w:gridCol w:w="{col_w}"/>')
    xml.append('</w:tblGrid>')
    
    for r_idx, row in enumerate(rows):
        is_header = (r_idx == 0)
        xml.append('<w:tr>')
        if is_header:
            xml.append('<w:trPr><w:tblHeader/></w:trPr>')
        for c_idx in range(col_count):
            cell_text = row[c_idx] if c_idx < len(row) else ""
            cell_runs = make_runs(cell_text.strip())
            shd = '<w:shd w:val="clear" w:color="auto" w:fill="F0F4F8"/>' if is_header else ''
            p_style = 'Normal'
            p_runs = cell_runs if not is_header else f'<w:r><w:rPr><w:b/><w:color w:val="003366"/></w:rPr><w:t xml:space="preserve">{escape(clean_xml(cell_text.strip()))}</w:t></w:r>'
            
            xml.append(f'''<w:tc>
                <w:tcPr>
                    <w:tcW w:w="{col_w}" w:type="dxa"/>
                    {shd}
                    <w:tcMar>
                        <w:top w:w="120" w:type="dxa"/>
                        <w:left w:w="150" w:type="dxa"/>
                        <w:bottom w:w="120" w:type="dxa"/>
                        <w:right w:w="150" w:type="dxa"/>
                    </w:tcMar>
                </w:tcPr>
                <w:p><w:pPr><w:pStyle w:val="{p_style}"/></w:pPr>{p_runs}</w:p>
            </w:tc>''')
        xml.append('</w:tr>')
    xml.append('</w:tbl>')
    xml.append(make_p(make_runs(""), style="Normal"))
    return "".join(xml)

body_xml = []
lines = md_text.splitlines()
in_code = False
code_lines = []
in_table = False
table_rows = []

i = 0
while i < len(lines):
    line = lines[i]
    stripped = line.strip()
    
    # Check for page break
    if '<div style="page-break-after: always;"></div>' in stripped or stripped == '---':
        if in_table:
            body_xml.append(make_table(table_rows))
            table_rows = []
            in_table = False
        body_xml.append(make_page_break())
        i += 1
        continue
    
    # Check for code block
    if stripped.startswith('```'):
        if in_code:
            in_code = False
            for cl in code_lines:
                escaped_code = escape(clean_xml(cl))
                body_xml.append(f'''<w:p>
                    <w:pPr>
                        <w:pStyle w:val="HTMLCode"/>
                        <w:ind w:left="400" w:right="400"/>
                    </w:pPr>
                    <w:r>
                        <w:rPr>
                            <w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/>
                            <w:sz w:val="18"/>
                            <w:szCs w:val="18"/>
                            <w:color w:val="1E293B"/>
                        </w:rPr>
                        <w:t xml:space="preserve">{escaped_code}</w:t>
                    </w:r>
                </w:p>''')
            code_lines = []
        else:
            if in_table:
                body_xml.append(make_table(table_rows))
                table_rows = []
                in_table = False
            in_code = True
            code_lines = []
        i += 1
        continue
    
    if in_code:
        code_lines.append(line)
        i += 1
        continue
    
    # Check for markdown table
    if stripped.startswith('|') and stripped.endswith('|'):
        if re.match(r'^\|[\s:-|]+\|$', stripped):
            i += 1
            continue
        cells = [c.strip() for c in stripped[1:-1].split('|')]
        table_rows.append(cells)
        in_table = True
        i += 1
        continue
    else:
        if in_table:
            body_xml.append(make_table(table_rows))
            table_rows = []
            in_table = False
    
    if not stripped:
        i += 1
        continue
    
    # Headings
    if stripped.startswith('# Chapter'):
        body_xml.append(make_p(make_runs(stripped[2:].strip()), style="Style1-Head1Chapters", page_break_before=True))
    elif stripped.startswith('# '):
        title = stripped[2:].strip()
        if title in ["KANDY INNOVATION CENTER", "NATIONAL INSTITUTE OF BUSINESS MANAGEMENT", "BACHELOR OF SCIENCE IN COMPUTER SCIENCE WITH AI"]:
            body_xml.append(make_p(make_runs(title), style="Normal", center=True))
        elif title in ["Individual Project Report"]:
            body_xml.append(make_p(make_runs(""), style="Normal"))
            body_xml.append(make_p(make_runs(f"**{title}**"), style="Heading1", center=True))
            body_xml.append(make_p(make_runs(""), style="Normal"))
        elif title.startswith("DESIGN AND DEVELOPMENT"):
            body_xml.append(make_p(make_runs(f"**{title}**"), style="Heading1", center=True))
            body_xml.append(make_p(make_runs(""), style="Normal"))
        elif title in ["REFERENCES", "APPENDICES"]:
            body_xml.append(make_p(make_runs(title), style="Style1-Head0firstpages", page_break_before=True))
        else:
            body_xml.append(make_p(make_runs(title), style="Style1-Head0firstpages"))
    elif stripped.startswith('## '):
        title = stripped[3:].strip()
        body_xml.append(make_p(make_runs(title), style="Style1-Head2"))
    elif stripped.startswith('### '):
        title = stripped[4:].strip()
        body_xml.append(make_p(make_runs(title), style="Style1-Head3"))
    elif stripped.startswith('#### '):
        title = stripped[5:].strip()
        body_xml.append(make_p(make_runs(f"**{title}**"), style="Style2-BodyTextIntend0"))
    elif stripped.startswith('- ') or stripped.startswith('* '):
        bullet_text = stripped[2:].strip()
        if "...." in bullet_text:
            body_xml.append(make_p(make_runs(bullet_text), style="TOC1"))
        else:
            body_xml.append(make_p(make_runs(bullet_text), style="Style3-Bullet1"))
    elif re.match(r'^\d+\.\s', stripped):
        m = re.match(r'^\d+\.\s(.*)$', stripped)
        body_xml.append(make_p(make_runs(m.group(1).strip()), style="Style4-numbering1"))
    elif stripped.startswith('**Table ') or stripped.startswith('*Table ') or stripped.startswith('Table '):
        body_xml.append(make_p(make_runs(stripped), style="Caption"))
    elif stripped.startswith('**Figure ') or stripped.startswith('*Figure ') or stripped.startswith('Figure '):
        body_xml.append(make_p(make_runs(stripped), style="Caption"))
    else:
        body_xml.append(make_p(make_runs(stripped), style="Style2-BodyTextIntend0"))
    
    i += 1

if in_table and table_rows:
    body_xml.append(make_table(table_rows))
    table_rows = []

# Final assembly of document.xml
full_doc_xml = doc_start + "\n" + "\n".join(body_xml) + "\n" + sect_pr + "</w:body></w:document>"

# Validate with ElementTree
try:
    ET.fromstring(full_doc_xml)
    print("Full document.xml validated successfully with ElementTree!")
except Exception as e:
    print("XML Validation Error:", e)
    sys.exit(1)

file_map['word/document.xml'] = full_doc_xml.encode('utf-8')

with zipfile.ZipFile(OUTPUT_DOCX, 'w', compression=zipfile.ZIP_DEFLATED) as z_out:
    for name, data in file_map.items():
        z_out.writestr(name, data)

print(f"Successfully generated DOCX report: {OUTPUT_DOCX}")
print(f"Generated DOCX size: {os.path.getsize(OUTPUT_DOCX):,} bytes")
