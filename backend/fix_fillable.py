import os

file_path = 'app/Models/Paper.php'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

old_fillable = """        'submission_status',
        'payment_status',
        'invoice_id',
        'payment_url'"""

new_fillable = """        'submission_status',
        'payment_status',
        'invoice_id',
        'payment_url',
        'access_type',
        'price'"""

if old_fillable in text:
    text = text.replace(old_fillable, new_fillable)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("SUCCESS")
else:
    print("FAILED TO FIND TARGET CODE")
