const fs = require('fs');
let content = fs.readFileSync('resources/js/Pages/PaperDetail.tsx', 'utf8');

content = content.replace(
    'await axios.post(/papers//generate-payment);',
    'await axios.post(/papers//generate-payment, { access_type: selectedAccessType });'
);

content = content.replace(
    'await axios.post(/papers//publish);',
    'await axios.post(/papers//publish, { access_type: selectedAccessType });'
);

fs.writeFileSync('resources/js/Pages/PaperDetail.tsx', content, 'utf8');
