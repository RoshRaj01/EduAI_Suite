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
4

Question 3
What is a computer?
A) A machine
B) A toy
C) A fruit
"""

def extract_questions(text):
    has_explicit_q = bool(re.search(r'(?:^|\n)\s*(?:Q|Question)\s*\d+', text, re.IGNORECASE))
    if has_explicit_q:
        q_pattern = r'(?:^|\n)\s*(?:Q(?:uestion)?\s*\d+[\.\)\:\-]?)\s*'
    else:
        q_pattern = r'(?:^|\n)\s*(?:Q(?:uestion)?\s*\d+[\.\)\:\-]?|\d+[\.\)\:\-])\s*'

    q_blocks = re.split(q_pattern, text, flags=re.IGNORECASE)
    
    questions = []
    for block in q_blocks:
        if not block.strip(): continue
        
        # New robust label pattern
        label_pattern_str = r'(?:^|\n|\s)(?:\()?([A-Ea-e])(?:(?:\)|\.)\s+|(?:\)|\.)?\s*\n)'
        
        opt_start_match = re.search(label_pattern_str, block)
        options = []
        if opt_start_match:
            q_text = block[:opt_start_match.start()].strip()
            options_text = block[opt_start_match.start():]
            
            label_pattern = re.compile(label_pattern_str, re.IGNORECASE)
            labels = list(label_pattern.finditer(options_text))
            
            for i, match in enumerate(labels):
                label = match.group(1).upper()
                start_idx = match.end()
                end_idx = labels[i+1].start() if i + 1 < len(labels) else len(options_text)
                
                opt_text = options_text[start_idx:end_idx].strip()
                options.append({"label": label, "text": opt_text})
        else:
            q_text = block.strip()
            
        questions.append({
            "question_text": q_text,
            "choices": options
        })

    return questions

import json
print(json.dumps(extract_questions(text), indent=2))
