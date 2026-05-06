import re
import io
import logging
from PyPDF2 import PdfReader
from docx import Document

logger = logging.getLogger(__name__)

class CoursePlanParser:
    @staticmethod
    def extract_text_from_pdf(file_content):
        try:
            reader = PdfReader(io.BytesIO(file_content))
            text = ""
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
            return text
        except Exception as e:
            logger.error(f"Error extracting PDF: {e}")
            return ""

    @staticmethod
    def extract_text_from_docx(file_content):
        try:
            doc = Document(io.BytesIO(file_content))
            text = ""
            for para in doc.paragraphs:
                text += para.text + "\n"
            return text
        except Exception as e:
            logger.error(f"Error extracting DOCX: {e}")
            return ""

    @staticmethod
    def parse_content(text):
        if not text:
            return {"topic": "", "syllabus_context": ""}

        # Topic Patterns
        # 1. Look for explicit labels
        # 2. Look for Markdown H1
        # 3. Look for "Lesson plan for..."
        topic_patterns = [
            r"(?i)(?:topic|subject|course(?:\s+name)?|module(?:\s+title)?|lesson\s+title)\s*[:=-]\s*(.*)",
            r"(?i)^#\s*(.*)",
            r"(?i)(?:lesson\s+plan\s+for)\s+(.*)"
        ]
        
        # Syllabus Patterns
        # 1. Look for explicit labels and capture until next section or double newline
        # 2. Look for Markdown H2
        syllabus_patterns = [
            r"(?i)(?:syllabus|context|outline|objectives|content|learning\s+outcomes|topics\s+covered)\s*[:=-]\s*([\s\S]*?)(?=\n\s*\n|\n\s*[A-Z\s]{3,}:|$)",
            r"(?i)##\s*(?:syllabus|context|objectives)\s*([\s\S]*?)(?=\n#|$)"
        ]
        
        topic = ""
        for pattern in topic_patterns:
            match = re.search(pattern, text, re.MULTILINE)
            if match:
                topic = match.group(1).strip()
                # Clean up if matched a line with other stuff
                topic = topic.split('\n')[0].strip()
                if topic:
                    break
        
        syllabus = ""
        for pattern in syllabus_patterns:
            match = re.search(pattern, text, re.MULTILINE)
            if match:
                syllabus = match.group(1).strip()
                if syllabus:
                    break
                
        # Fallback for Topic if nothing found: First non-empty line
        if not topic:
            lines = [l.strip() for l in text.split('\n') if l.strip()]
            if lines:
                first_line = lines[0]
                if len(first_line) < 100:
                    topic = first_line

        return {
            "topic": topic,
            "syllabus_context": syllabus
        }
