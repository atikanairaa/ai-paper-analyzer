<?php
$content = file_get_contents('app/Http/Controllers/PaperController.php');

$pattern = '/    public function viewWatermarkedPdf\(\$id\)\n    \{\n        \$paper = Paper::findOrFail\(\$id\);\n\n        \n\n            storage_path/s';
$replacement = <<<EOT
    public function viewWatermarkedPdf(\$id)
    {
        \$paper = Paper::findOrFail(\$id);

        \$paths = [
            storage_path
EOT;

$content = preg_replace($pattern, $replacement, $content);
file_put_contents('app/Http/Controllers/PaperController.php', $content);
echo "Fixed viewWatermarkedPdf syntax\n";
