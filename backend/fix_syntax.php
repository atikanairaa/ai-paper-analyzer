<?php
$content = file_get_contents('app/Http/Controllers/PaperController.php');

// We need to replace everything from "public function viewPdf($id)" to "foreach ($candidatePaths as $path) {"
$start = "    public function viewPdf(\$id)\n    {\n        \$paper = Paper::findOrFail(\$id);";
$end = "        foreach (\$candidatePaths as \$path) {";

$pattern = '/    public function viewPdf\(\$id\).*?foreach \(\$candidatePaths as \$path\) \{/s';

$replacement = <<<EOT
    public function viewPdf(\$id)
    {
        \$paper = Paper::findOrFail(\$id);

        \$filePath = \$paper->file_path;

        // Bersihkan prefix jika tersimpan 'storage/' atau 'public/' di database
        \$cleanPath = ltrim(preg_replace('#^(public/|storage/)#', '', \$filePath), '/');

        \$candidatePaths = [
            // Storage public disk
            Storage::disk('public')->path(\$cleanPath),
            storage_path('app/public/' . \$cleanPath),
            // Storage local/private disk (Laravel 11 default)
            storage_path('app/private/' . \$cleanPath),
            storage_path('app/' . \$cleanPath),
            Storage::disk('local')->path(\$cleanPath),
            // Public path langsung
            public_path('storage/' . \$cleanPath),
            public_path(\$cleanPath),
        ];

        foreach (\$candidatePaths as \$path) {
EOT;

$content = preg_replace($pattern, $replacement, $content);
file_put_contents('app/Http/Controllers/PaperController.php', $content);
echo "Fixed viewPdf syntax\n";
