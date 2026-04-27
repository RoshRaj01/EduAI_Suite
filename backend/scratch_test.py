import re

text = """Question 1
Predict the output of following program. Assume that the numbers are stored in 2's complement form.
#include<stdio.h>
int main()
{
  unsigned int x = -1;
  int y = ~0;
  if (x == y)
    printf("same");
  else
    printf("not same");
  return 0;
}
A
same
B
not same
C
compiler error
D
none

Question 2
Which of the following is not a valid declaration in C?
1. short int x;
2. signed short x;
3. short x;
4. unsigned short x;
A
1
B
2
C
3
D
4"""

def extract_questions(text):
    # Check if we have explicit "Question N" or "Q N"
    has_explicit_q = bool(re.search(r'(?:^|\n)\s*(?:Q|Question)\s*\d+', text, re.IGNORECASE))
    
    if has_explicit_q:
        q_pattern = r'(?:^|\n)\s*(?:Q(?:uestion)?\s*\d+[\.\)\:\-]?)\s*'
    else:
        q_pattern = r'(?:^|\n)\s*(?:Q(?:uestion)?\s*\d+[\.\)\:\-]?|\d+[\.\)\:\-])\s*'

    q_blocks = re.split(q_pattern, text, flags=re.IGNORECASE)
    
    questions = []
    for block in q_blocks:
        if not block.strip(): continue
        
        # We need to extract options.
        # Options can be A) B) C) D) OR
        # just "A\nsame\nB\nnot same"
        # Let's search for A, B, C, D at the start of lines.
        # But we don't want to capture "A" from "A Apple a day".
        # If a line is EXACTLY "A" or "A." or "A)"
        
        opt_start_match = re.search(r'(?:^|\n|\s)(?:\()?[Aa](?:\)|\.)?\s*\n', block)
        if not opt_start_match:
            # Maybe they are on the same line like "A) same"
            opt_start_match = re.search(r'(?:^|\n|\s)(?:\()?[Aa](?:\)|\.)\s+', block)
            
        options = []
        if opt_start_match:
            q_text = block[:opt_start_match.start()].strip()
            options_text = block[opt_start_match.start():]
            
            # Pattern for labels:
            # 1. Label on its own line: ^A$ \n (text)
            # 2. Label with text: ^A) text
            label_pattern = re.compile(r'(?:^|\n|\s)(?:\()?([A-Ea-e])(?:\)|\.)?(?:\s*\n|\s+)', re.IGNORECASE)
            labels = list(label_pattern.finditer(options_text))
            
            # Filter out invalid labels (e.g., if it matches a random "a " in a sentence)
            # We enforce that labels must be somewhat sequential or follow a structure.
            # For now, let's assume all matched labels are valid options.
            # But "a " is too common. So if there's no punctuation and it's not on its own line, we skip?
            # Wait, our regex `(?:\s*\n|\s+)` means "A \n" or "A ".
            # If it's "A ", it could be "a apple".
            
            # Let's refine the label extraction.
            options_parsed = []
            for i, match in enumerate(labels):
                label = match.group(1).upper()
                start_idx = match.end()
                end_idx = labels[i+1].start() if i + 1 < len(labels) else len(options_text)
                
                opt_text = options_text[start_idx:end_idx].strip()
                options_parsed.append({"label": label, "text": opt_text})
            
            options = options_parsed
        else:
            q_text = block.strip()
            
        questions.append({
            "question_text": q_text,
            "choices": options
        })

    return questions

import json
print(json.dumps(extract_questions(text), indent=2))
