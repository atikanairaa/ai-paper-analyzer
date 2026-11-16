const fs = require('fs');
let content = fs.readFileSync('resources/js/Pages/PaperDetail.tsx', 'utf8');

content = content.replace(
    'isReadyToPublish ? "Siap Dipublikasikan! \u2014 Siap Dipublikasikan!"',
    'isReadyToPublish ? "Siap Dipublikasikan!"'
);

// also handle normal hyphen just in case
content = content.replace(
    'isReadyToPublish ? "Siap Dipublikasikan! - Siap Dipublikasikan!"',
    'isReadyToPublish ? "Siap Dipublikasikan!"'
);

// also handle mojibake
content = content.replace(
    /isReadyToPublish \? "Siap Dipublikasikan![^"]+Siap Dipublikasikan!"/,
    'isReadyToPublish ? "Siap Dipublikasikan!"'
);

fs.writeFileSync('resources/js/Pages/PaperDetail.tsx', content, 'utf8');
