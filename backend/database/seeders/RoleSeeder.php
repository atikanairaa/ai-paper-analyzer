<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Bersihkan cache permission Spatie sebelum seeding
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Buat roles
        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'researcher']);
        Role::firstOrCreate(['name' => 'reviewer']);
    }
}
