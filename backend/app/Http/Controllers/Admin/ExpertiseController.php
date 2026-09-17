<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Expertise;

class ExpertiseController extends Controller
{
    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|unique:expertises,name|max:255']);
        $expertise = Expertise::create(['name' => $request->name]);
        return response()->json($expertise);
    }

    public function update(Request $request, $id)
    {
        $request->validate(['name' => 'required|string|unique:expertises,name,'.$id.'|max:255']);
        $expertise = Expertise::findOrFail($id);
        $expertise->update(['name' => $request->name]);
        return response()->json($expertise);
    }

    public function destroy($id)
    {
        Expertise::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
