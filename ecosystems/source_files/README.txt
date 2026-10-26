Source files for the Ecosystems study guide (you don't need these to use the guide)

guide/        Study-guide text (Markdown) and the glossary (glossary.json)
questions/    101 practice questions as JSON (qA–qD = topic drills, qM = mock test),
              plus independent_blind_check.json from a second reviewer who answered
              every question without the key (all 101 matched)
figures_svg/  The 32 vector diagrams
build_tools/  Scripts that rebuild the outputs:
              build.py builds Ecosystems_Study_Guide.html, pdf.py builds the print PDF,
              minidom_test.js runs the automated click-through test
source_brief.md, research_notes.md, spec.md
              Summary of the class handouts, the fact-checked research notes with
              sources, and the build specification

To rebuild, set ROOT in build_tools/build.py to the folder that holds these files,
then run:  python3 build.py  and then  python3 pdf.py
