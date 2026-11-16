const fs = require('fs');
let content = fs.readFileSync('resources/js/Pages/Upload.tsx', 'utf8');

// Remove state
content = content.replace(/const \[accessType, setAccessType\] = useState\<'OPEN_ACCESS' \| 'CLOSED_ACCESS'\>\('OPEN_ACCESS'\);\\n\s*/g, '');

// Remove formData append
content = content.replace(/formData\.append\('access_type', accessType\);\\n\s*/g, '');

// Remove UI
content = content.replace(/\{\/\* Access Type \(Only show if Journal Submission\) \*\/\}(.|\n)*?<\/div>\s*<\/div>\s*\)\}/, '');

fs.writeFileSync('resources/js/Pages/Upload.tsx', content, 'utf8');
