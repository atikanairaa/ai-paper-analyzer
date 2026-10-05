import os

with open('resources/js/Pages/PaperDetail.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

old_elements = """const RESEARCH_ELEMENTS = [
    { key: "problem_statement", label: "Problem Statement", icon: "❶" },
    { key: "research_question", label: "Research Question", icon: "❷" },
    { key: "objective", label: "Objective", icon: "❸" },
    { key: "hypothesis", label: "Hypothesis", icon: "❹" },
    { key: "methodology", label: "Methodology", icon: "❺" },
    { key: "dataset", label: "Dataset / Data", icon: "❻" },
    { key: "experiment", label: "Experiment", icon: "❼" },
    { key: "results", label: "Results", icon: "❽" },
    { key: "conclusion", label: "Conclusion", icon: "❾" },
    { key: "limitation", label: "Limitation", icon: "❿" },
];"""

new_elements = """const RESEARCH_ELEMENTS = [
    { key: "problem_statement", label: "Problem Statement", icon: "❶", synonyms: ["research problem", "problem", "background"] },
    { key: "research_question", label: "Research Question", icon: "❷", synonyms: ["research questions"] },
    { key: "objective", label: "Objective", icon: "❸", synonyms: ["research objective", "aim", "objectives"] },
    { key: "hypothesis", label: "Hypothesis", icon: "❹", synonyms: ["hypotheses"] },
    { key: "methodology", label: "Methodology", icon: "❺", synonyms: ["method", "methods", "proposed method"] },
    { key: "dataset", label: "Dataset / Data", icon: "❻", synonyms: ["data"] },
    { key: "experiment", label: "Experiment", icon: "❼", synonyms: ["experiments", "setup", "evaluation"] },
    { key: "results", label: "Results", icon: "❽", synonyms: ["result", "findings", "discussion"] },
    { key: "conclusion", label: "Conclusion", icon: "❾", synonyms: ["conclusions"] },
    { key: "limitation", label: "Limitation", icon: "❿", synonyms: ["limitations", "future work"] },
];"""

old_loop = """        // Also try matching partial keys
        RESEARCH_ELEMENTS.forEach((el) => {
            if (
                s.section_name
                    .toLowerCase()
                    .includes(el.key.replace(/_/g, " ")) ||
                el.key.replace(/_/g, " ").includes(s.section_name.toLowerCase())
            ) {
                sectionsMap[el.key] = s.is_found;
            }
        });"""

new_loop = """        // Also try matching partial keys and synonyms
        RESEARCH_ELEMENTS.forEach((el) => {
            const sectionLower = s.section_name.toLowerCase();
            const elKeySpace = el.key.replace(/_/g, " ");
            
            let isMatch = sectionLower.includes(elKeySpace) || elKeySpace.includes(sectionLower);
            
            if (!isMatch && el.synonyms) {
                isMatch = el.synonyms.some(syn => sectionLower.includes(syn) || syn.includes(sectionLower));
            }
            
            if (isMatch) {
                sectionsMap[el.key] = s.is_found;
            }
        });"""

if old_elements in text and old_loop in text:
    text = text.replace(old_elements, new_elements)
    text = text.replace(old_loop, new_loop)
    with open('resources/js/Pages/PaperDetail.tsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print("SUCCESS")
else:
    print("NOT FOUND")
