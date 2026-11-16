<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Akun Admin
        $admin = User::firstOrCreate(
            ['email' => 'admin@admin.com'],
            [
                'name' => 'Admin System',
                'password' => Hash::make('password123'),
            ]
        );
        // Pastikan role disesuaikan dengan yang ada di RoleSeeder ('admin')
        $admin->assignRole('admin');

        // 2. Akun Researcher (Peneliti)
        $researcher = User::firstOrCreate(
            ['email' => 'researcher@gmail.com'],
            [
                'name' => 'John Researcher',
                'password' => Hash::make('password123'),
            ]
        );
        $researcher->assignRole('researcher');

        // 3. Akun Reviewer (Peninjau)
        $reviewer = User::firstOrCreate(
            ['email' => 'reviewer@gmail.com'],
            [
                'name' => 'Jane Reviewer',
                'password' => Hash::make('password123'),
            ]
        );
        $reviewer->assignRole('reviewer');
    }
}
