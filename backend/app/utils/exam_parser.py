import re
import PyPDF2
import docx
import io

def parse_mcqs_from_text(text):
    """
    Simple parser to extract MCQs from text.
    Expected format:
    1. Question text
    A) Option A
    B) Option B
    C) Option C
    D) Option D
    Answer: A
    """
    questions = []
    # Split by numbers followed by a dot or parenthesis: 1. or 1)
    raw_blocks = re.split(r'\n\s*\d+[\.\)]\s+', text)
    
    for block in raw_blocks:
        if not block.strip():
            continue
            
        lines = [l.strip() for l in block.split('\n') if l.strip()]
        if len(lines) < 2:
            continue
            
        question_text = lines[0]
        options = []
        correct_answer_char = None
        
        for line in lines[1:]:
            # Check for answer line
            ans_match = re.search(r'(?:Answer|Correct|Ans)[:\s]*([A-D])', line, re.IGNORECASE)
            if ans_match:
                correct_answer_char = ans_match.group(1).upper()
                continue
                
            # Check for options like A) text or A. text
            opt_match = re.match(r'^([A-D])[\.\)]\s+(.*)', line, re.IGNORECASE)
            if opt_match:
                char = opt_match.group(1).upper()
                content = opt_match.group(2).strip()
                options.append({"char": char, "text": content})
        
        if options:
            parsed_options = []
            for opt in options:
                is_correct = (opt["char"] == correct_answer_char)
                parsed_options.append({"option_text": opt["text"], "is_correct": is_correct})
            
            # If no answer was found but we have options, just mark first as correct for user to edit? 
            # Better to let them know
            questions.append({
                "question_text": question_text,
                "options": parsed_options,
                "points": 1
            })
            
    return questions

def extract_text_from_file(file_contents, filename):
    text = ""
    if filename.endswith(".pdf"):
        reader = PyPDF2.PdfReader(io.BytesIO(file_contents))
        for page in reader.pages:
            text += page.extract_text() + "\n"
    elif filename.endswith(".docx") or filename.endswith(".doc"):
        # Note: .doc might require different handling, but often python-docx can try or we limit to .docx
        doc = docx.Document(io.BytesIO(file_contents))
        text = "\n".join([para.text for para in doc.paragraphs])
    return text
