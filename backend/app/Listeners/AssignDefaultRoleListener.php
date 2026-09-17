<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Log;

class AssignDefaultRoleListener
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(Registered $event): void
    {
        try {
            // Memastikan user yang terdaftar memiliki fungsi assignRole (dari Spatie)
            if (method_exists($event->user, 'assignRole')) {
                // Memberikan role default 'researcher'
                $event->user->assignRole('researcher');
            } else {
                Log::warning('AssignDefaultRoleListener: User model does not use HasRoles trait.', [
                    'user_id' => $event->user->id ?? null
                ]);
            }
        } catch (\Throwable $th) {
            // Mencatat error jika penugasan role gagal
            Log::error('AssignDefaultRoleListener: Failed to assign default role.', [
                'user_id' => $event->user->id ?? null,
                'error_message' => $th->getMessage(),
                'trace' => $th->getTraceAsString(),
            ]);
        }
    }
}
