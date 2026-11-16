<?php
$content = file_get_contents('app/Http/Controllers/PaperController.php');

$search = <<<EOT
    public function viewWatermarkedPdf(\$id)
    {
        \$paper = Paper::findOrFail(\$id);
        
        
            storage_path('app/private/' . \$paper->file_path),
EOT;
$search = str_replace("\r", "", $search);
$content = str_replace("\r", "", $content);

$replace = <<<EOT
    public function viewWatermarkedPdf(\$id)
    {
        \$paper = Paper::findOrFail(\$id);
        
        \$paths = [
            storage_path('app/private/' . \$paper->file_path),
EOT;
$replace = str_replace("\r", "", $replace);

$content = str_replace($search, $replace, $content);
file_put_contents('app/Http/Controllers/PaperController.php', $content);
echo "Done\n";
