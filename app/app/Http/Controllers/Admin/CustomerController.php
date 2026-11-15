<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $term = trim($request->string('q')->value());

        $customers = User::query()
            ->where('role', UserRole::Customer)
            ->when($term !== '', fn ($q) => $q->where(fn ($inner) => $inner
                ->where('name', 'like', "%{$term}%")
                ->orWhere('email', 'like', "%{$term}%")
                ->orWhere('phone', 'like', "%{$term}%")))
            ->withCount('bookings')
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'is_active' => $user->is_active,
                'bookings_count' => $user->bookings_count,
            ]);

        return Inertia::render('Admin/Customers/Index', [
            'customers' => $customers,
            'filters' => ['q' => $term],
        ]);
    }

    public function show(User $customer): Response
    {
        Gate::authorize('view', $customer);

        $bookings = Booking::query()
            ->with('court:id,name')
            ->where('user_id', $customer->id)
            ->orderByDesc('starts_at')
            ->get();

        return Inertia::render('Admin/Customers/Show', [
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'is_active' => $customer->is_active,
                'created_at' => $customer->created_at->toIso8601String(),
            ],
            'stats' => [
                'total' => $bookings->count(),
                'cancelled' => $bookings->where('status', 'cancelled')->count(),
                'no_show' => $bookings->where('status', 'no_show')->count(),
                'spent_cents' => $bookings->whereIn('status', ['confirmed', 'completed'])->sum('price_cents'),
            ],
            'bookings' => $bookings->map(fn (Booking $booking) => [
                'id' => $booking->id,
                'code' => $booking->code,
                'starts_at' => $booking->starts_at->toIso8601String(),
                'status' => $booking->status->value,
                'price_cents' => $booking->price_cents,
                'court' => $booking->court->name,
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('update', User::class);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190', Rule::unique('users')],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $customer = User::create([
            ...$data,
            'password' => Hash::make($data['password']),
            'role' => UserRole::Customer,
        ]);

        return back()->with('success', 'Cliente creado: '.$customer->name);
    }

    public function update(Request $request, User $customer): RedirectResponse
    {
        Gate::authorize('update', $customer);

        abort_if($customer->isStaff(), 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190', Rule::unique('users')->ignore($customer->id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'is_active' => ['required', 'boolean'],
        ]);

        $customer->update($data);

        return back()->with('success', 'Datos del cliente actualizados.');
    }
}
