import os

file_path = 'resources/js/Pages/Guest/Catalog.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Locate the Go to Dashboard button link
target = """                        <Link href="/login" className="bg-stone-800 hover:bg-stone-900 text-white px-5 py-2 rounded-xl transition-colors ml-4 shadow-sm">
                            Go to Dashboard
                        </Link>"""

if target in text:
    text = text.replace(target, "")
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("SUCCESS: Button removed")
else:
    print("ERROR: Target not found")
