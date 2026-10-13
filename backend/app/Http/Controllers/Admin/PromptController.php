<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EvaluationCriterion;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PromptController extends Controller
{
    /**
     * Menampilkan halaman daftar Kriteria Penilaian untuk Admin
     */
    public function index()
    {
        $criteria = EvaluationCriterion::orderBy('id', 'asc')->get();

        return Inertia::render('Admin/ManagePrompts', [
            'criteria' => $criteria
        ]);
    }

    /**
     * Menyimpan kriteria penilaian baru ke database
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category'    => 'required|string|max:255',
            'name'        => 'required|string|max:255',
            'instruction' => 'nullable|string',
            'weight'      => 'required|integer|min:1|max:100',
            'is_active'   => 'boolean',
            'is_analyze'  => 'boolean',
            'is_review'   => 'boolean',
            'is_qa'       => 'boolean',
        ]);

        $criteria = EvaluationCriterion::create($validated);

        // Catat ke Audit Log
        DB::table('audit_logs')->insert([
            'user_id'    => auth()->id() ?? 1,
            'action'     => 'CREATE_EVALUATION_CRITERIA',
            'paper_id'   => null,
            'ip_address' => $request->ip(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()->back()->with('success', "Kriteria \"{$criteria->name}\" berhasil ditambahkan!");
    }

    /**
     * Memperbarui kriteria penilaian yang sudah ada
     */
    public function update(Request $request, EvaluationCriterion $criterion)
    {
        $validated = $request->validate([
            'category'    => 'required|string|max:255',
            'name'        => 'required|string|max:255',
            'instruction' => 'nullable|string',
            'weight'      => 'required|integer|min:1|max:100',
            'is_active'   => 'boolean',
            'is_analyze'  => 'boolean',
            'is_review'   => 'boolean',
            'is_qa'       => 'boolean',
        ]);

        $criterion->update($validated);

        // Catat ke Audit Log
        DB::table('audit_logs')->insert([
            'user_id'    => auth()->id() ?? 1,
            'action'     => 'UPDATE_EVALUATION_CRITERIA',
            'paper_id'   => null,
            'ip_address' => $request->ip(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()->back()->with('success', "Kriteria \"{$criterion->name}\" berhasil diperbarui!");
    }

    /**
     * Menghapus kriteria penilaian dari database
     */
    public function destroy(Request $request, EvaluationCriterion $criterion)
    {
        $criterionName = $criterion->name;

        $criterion->delete();

        // Catat ke Audit Log
        DB::table('audit_logs')->insert([
            'user_id'    => auth()->id() ?? 1,
            'action'     => 'DELETE_EVALUATION_CRITERIA',
            'paper_id'   => null,
            'ip_address' => $request->ip(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()->back()->with('success', "Kriteria \"{$criterionName}\" berhasil dihapus!");
    }

    /**
     * Mengubah nama kategori beserta seluruh kriteria di dalamnya
     */
    public function renameCategory(Request $request)
    {
        $request->validate([
            'old_category' => 'required|string',
            'new_category' => 'required|string|max:255',
        ]);

        $old = $request->old_category;
        $new = trim($request->new_category);

        $count = EvaluationCriterion::where('category', $old)->count();
        EvaluationCriterion::where('category', $old)->update(['category' => $new]);

        DB::table('audit_logs')->insert([
            'user_id'    => auth()->id() ?? 1,
            'action'     => 'RENAME_PROMPT_CATEGORY',
            'paper_id'   => null,
            'ip_address' => $request->ip(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()->back()->with('success', "Kategori \"{$old}\" berhasil diubah menjadi \"{$new}\" ({$count} kriteria diperbarui)!");
    }

    /**
     * Menghapus seluruh kriteria dalam satu kategori
     */
    public function destroyCategory(Request $request)
    {
        $request->validate([
            'category' => 'required|string',
        ]);

        $category = $request->category;
        $count = EvaluationCriterion::where('category', $category)->count();
        EvaluationCriterion::where('category', $category)->delete();

        DB::table('audit_logs')->insert([
            'user_id'    => auth()->id() ?? 1,
            'action'     => 'DELETE_PROMPT_CATEGORY',
            'paper_id'   => null,
            'ip_address' => $request->ip(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()->back()->with('success', "Kategori \"{$category}\" beserta {$count} kriterianya berhasil dihapus!");
    }
}