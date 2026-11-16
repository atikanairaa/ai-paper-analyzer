<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;
use Spatie\Permission\Traits\HasRoles;

class EnsureAdminDoesNotAccessReviewer
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var \App\Models\User $user */ // <--- Tambahkan komentar ini
        $user = Auth::user();

        if ($user && $user->hasRole('admin')) {
            if ($request->is('reviewer/*')) {
                abort(403, 'Akses ditolak: Admin dilarang mengakses area Reviewer.');
            }
        }

        return $next($request);
    }
}
