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
    public function index(Request $request)
    {
        User::ensurePrimaryAdministratorExists();

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'per_page' => ['nullable', 'integer', 'in:10,50,100'],
        ]);
        $search = $filters['search'] ?? '';
        $perPage = (int) ($filters['per_page'] ?? 10);

        $users = User::query()
            ->where('role', 'admin')
            ->when($search, function ($query, string $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'is_protected' => $user->isPrimaryAdministrator(),
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
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
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
        abort_unless($user->role === 'admin' || $user->isPrimaryAdministrator(), 404);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
        ]);

        if (
            $user->isPrimaryAdministrator()
            && strcasecmp($validated['email'], User::primaryAdministratorEmail()) !== 0
        ) {
            return back()->withErrors([
                'user' => 'The primary administrator email cannot be changed.',
            ]);
        }

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->role = 'admin';
        $user->email_verified_at ??= now();

        $user->save();

        return back()->with('success', 'Admin user updated successfully.');
    }

    public function destroy(User $user)
    {
        if ($user->isPrimaryAdministrator()) {
            return back()->withErrors([
                'user' => User::PRIMARY_ADMIN_PROTECTED_MESSAGE,
            ]);
        }

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
