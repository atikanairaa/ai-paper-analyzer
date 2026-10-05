const fs = require('fs');
let content = fs.readFileSync('resources/js/Pages/PaperDetail.tsx', 'utf8');

if (!content.includes('const [selectedAccessType, setSelectedAccessType]')) {
    content = content.replace(
        'const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);',
        'const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);\n    const [selectedAccessType, setSelectedAccessType] = useState<"OPEN_ACCESS" | "CLOSED_ACCESS">("OPEN_ACCESS");'
    );
    fs.writeFileSync('resources/js/Pages/PaperDetail.tsx', content, 'utf8');
}
