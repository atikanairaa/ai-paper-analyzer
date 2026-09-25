<?php
$content = file_get_contents('app/Http/Controllers/PaperController.php');

$conflictBlock = <<<EOT
<<<<<<< HEAD
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
=======
        
        \$paths = [
            storage_path('app/private/' . \$paper->file_path),
            storage_path('app/public/' . \$paper->file_path),
            storage_path('app/' . \$paper->file_path),
            public_path('storage/' . \$paper->file_path),
            public_path(\$paper->file_path),
>>>>>>> feature/backend
        ];

<<<<<<< HEAD
        foreach (\$candidatePaths as \$path) {
            if (file_exists(\$path) && is_file(\$path)) {
=======
        foreach (\$paths as \$path) {
            if (file_exists(\$path)) {
>>>>>>> feature/backend
EOT;

$resolvedBlock = <<<EOT
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
            if (file_exists(\$path) && is_file(\$path)) {
EOT;

$content = str_replace($conflictBlock, $resolvedBlock, $content);
file_put_contents('app/Http/Controllers/PaperController.php', $content);
echo "Resolved PaperController\n";
