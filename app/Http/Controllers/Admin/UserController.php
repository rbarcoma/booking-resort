<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        $users = User::query()
            ->where('role', 'admin')
            ->latest()
            ->paginate(10)
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'email_verified_at' => $user->email_verified_at?->toISOString(),
                'created_at' => $user->created_at?->format('M d, Y'),
                'updated_at' => $user->updated_at?->format('M d, Y'),
            ]);

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'summary' => [
                'totalAdmins' => User::where('role', 'admin')->count(),
            ],
            'currentUserId' => Auth::id(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        return back()->with('success', 'Admin user created successfully.');
    }

    public function update(Request $request, User $user)
    {
        abort_unless($user->role === 'admin', 404);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->role = 'admin';
        $user->email_verified_at ??= now();

        if (! empty($validated['password'])) {
            $user->password = $validated['password'];
        }

        $user->save();

        return back()->with('success', 'Admin user updated successfully.');
    }

    public function destroy(User $user)
    {
        abort_unless($user->role === 'admin', 404);

        request()->validate([
            'password' => ['required', 'current_password:web'],
        ]);

        if ($user->is(Auth::user())) {
            return back()->withErrors([
                'user' => 'You cannot delete your own admin account.',
            ]);
        }

        if (User::where('role', 'admin')->count() <= 1) {
            return back()->withErrors([
                'user' => 'At least one admin account must remain.',
            ]);
        }

        $user->delete();

        return back()->with('success', 'Admin user deleted successfully.');
    }
}
