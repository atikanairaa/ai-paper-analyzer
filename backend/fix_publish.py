import os

file_path = 'resources/js/Pages/PaperDetail.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

old_code = """                    await axios.post(`/papers/${paper.id}/publish`);"""
new_code = """                    await axios.post(`/papers/${paper.id}/publish`, { access_type: selectedAccessType });"""

if old_code in text:
    text = text.replace(old_code, new_code)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("SUCCESS")
else:
    print("FAILED TO FIND TARGET CODE")
