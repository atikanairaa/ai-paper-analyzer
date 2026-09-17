<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class ReviewerAccountController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'expertise' => 'nullable|string|max:255',
        ]);

        try {
            DB::beginTransaction();

            $user = new User();
            $user->name = $request->name;
            $user->email = $request->email;
            $user->password = Hash::make($request->password);
            $user->expertise = $request->expertise;
            $user->save();

            $user->assignRole('reviewer');

            DB::table('audit_logs')->insert([
                'user_id' => auth()->id(),
                'action' => 'CREATE_REVIEWER',
                'created_at' => now(),
            ]);

            DB::commit();

            return response()->json(['message' => 'Akun reviewer berhasil dibuat.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal membuat akun: ' . $e->getMessage()], 500);
        }
    }
}
