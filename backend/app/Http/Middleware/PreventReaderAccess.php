<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PreventReaderAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->check() && auth()->user()->hasRole('reader')) {
            return redirect()->route('guest.catalog')->with('error', 'Akses ditolak. Halaman tersebut khusus untuk Peneliti.');
        }

        return $next($request);
    }
}
