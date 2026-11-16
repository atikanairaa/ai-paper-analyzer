<?php
require "vendor/autoload.php";
$app = require_once __DIR__."/bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

while (true) {
    DB::statement("UPDATE papers SET payment_status = 'PAID' WHERE payment_status IN ('UNPAID', 'PENDING') AND invoice_id IS NOT NULL AND TIMESTAMPDIFF(SECOND, updated_at, NOW()) > 15");
    sleep(3);
}
