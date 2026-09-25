<?php
$content = file_get_contents('app/Http/Controllers/PaperController.php');

$pattern = '/    public function viewWatermarkedPdf\(\$id\).*?        \n        \$pdfPath = null;/s';
$replacement = <<<EOT
    public function viewWatermarkedPdf(\$id)
    {
        \$paper = Paper::findOrFail(\$id);
        
        \$paths = [
            storage_path('app/private/' . \$paper->file_path),
            storage_path('app/public/' . \$paper->file_path),
            storage_path('app/' . \$paper->file_path),
            public_path('storage/' . \$paper->file_path),
            public_path(\$paper->file_path),
        ];
        
        \$pdfPath = null;
EOT;

$content = preg_replace($pattern, $replacement, $content);
file_put_contents('app/Http/Controllers/PaperController.php', $content);
echo "Fixed!\n";
