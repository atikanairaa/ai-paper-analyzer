import sys

with open('resources/js/Pages/PaperDetail.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_1 = 'const isPaid = (paper as any).payment_status === "PAID";'
new_1 = '''const isPaid = (paper as any).payment_status === "PAID";
                                  const isFreeForAuthor = (paper as any).access_type === "CLOSED_ACCESS";
                                  const isReadyToPublish = isPaid || isFreeForAuthor;'''

content = content.replace(old_1, new_1)
content = content.replace("isPaid ? 'bg-indigo", "isReadyToPublish ? 'bg-indigo")
content = content.replace("isPaid ? 'text-indigo", "isReadyToPublish ? 'text-indigo")
content = content.replace('isPaid ? "Pembayaran Selesai — Siap Dipublikasikan!" :', 'isReadyToPublish ? "Siap Dipublikasikan!" :')
content = content.replace('isPaid\n                                                          ? "Pembayaran Anda telah dikonfirmasi. Klik tombol di bawah untuk mempublikasikan paper Anda ke jurnal."\n                                                          : "Silakan selesaikan administrasi publikasi jurnal dengan melakukan pembayaran."', 'isReadyToPublish ? (isFreeForAuthor ? "Paper Anda berstatus Closed Access (gratis publikasi). Klik tombol di bawah untuk mempublikasikan paper." : "Pembayaran Anda telah dikonfirmasi. Klik tombol di bawah untuk mempublikasikan paper.") : "Silakan selesaikan administrasi publikasi jurnal dengan melakukan pembayaran."')
content = content.replace('isPaid ? (', 'isReadyToPublish ? (')
content = content.replace('isPaid ? "Pembayaran Selesai', 'isReadyToPublish ? "Pembayaran Selesai')

with open('resources/js/Pages/PaperDetail.tsx', 'w', encoding='utf-8', newline='') as f:
    f.write(content)
