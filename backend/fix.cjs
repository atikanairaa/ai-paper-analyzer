const fs = require('fs');
let content = fs.readFileSync('resources/js/Pages/PaperDetail.tsx', 'utf8');

content = content.replace(
    'const isPaid = (paper as any).payment_status === "PAID";',
    'const isPaid = (paper as any).payment_status === "PAID";\n                                  const isFreeForAuthor = (paper as any).access_type === "CLOSED_ACCESS";\n                                  const isReadyToPublish = isPaid || isFreeForAuthor;'
);

content = content.replace(/isPaid \? 'bg-indigo/g, "isReadyToPublish ? 'bg-indigo");
content = content.replace(/isPaid \? 'text-indigo/g, "isReadyToPublish ? 'text-indigo");
content = content.replace(/isPaid \? "Pembayaran Selesai/g, "isReadyToPublish ? \"Siap Dipublikasikan!");
content = content.replace(/isPaid\s*\?\s*"Pembayaran Anda telah dikonfirmasi[^"]+"\s*:\s*"Silakan selesaikan administrasi[^"]+"/g, 'isReadyToPublish ? (isFreeForAuthor ? "Paper Anda berstatus Closed Access (gratis publikasi). Klik tombol di bawah untuk mempublikasikan paper." : "Pembayaran Anda telah dikonfirmasi. Klik tombol di bawah untuk mempublikasikan paper.") : "Silakan selesaikan administrasi publikasi jurnal dengan melakukan pembayaran."');
content = content.replace(/isPaid \? \(/g, "isReadyToPublish ? (");

fs.writeFileSync('resources/js/Pages/PaperDetail.tsx', content, 'utf8');
