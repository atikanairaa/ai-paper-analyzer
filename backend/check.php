<?php
echo app('App\Http\Controllers\GuestPaperController')->show(request(), 69)->toResponse(request())->getContent();
