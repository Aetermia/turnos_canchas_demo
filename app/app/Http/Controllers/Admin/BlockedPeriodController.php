<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\BlockedPeriod;
use App\Models\Court;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class BlockedPeriodController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('viewAny', BlockedPeriod::class);

        $blocks = BlockedPeriod::query()
            ->with('court:id,name', 'createdBy:id,name')
            ->orderByDesc('starts_at')
            ->limit(100)
            ->get();

        return Inertia::render('Admin/Blocks/Index', [
            'blocks' => $blocks->map(fn (BlockedPeriod $block) => [
                'id' => $block->id,
                'court' => $block->court?->name,
                'starts_at' => $block->starts_at->toIso8601String(),
                'ends_at' => $block->ends_at->toIso8601String(),
                'reason' => $block->reason,
                'created_by' => $block->createdBy?->name,
                'is_past' => $block->ends_at->isPast(),
            ]),
            'courts' => Court::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create', BlockedPeriod::class);

        $data = $request->validate([
            'court_id' => ['nullable', 'integer', 'exists:courts,id'],
            'date' => ['required', 'date_format:Y-m-d'],
            'starts_at' => ['required', 'date_format:H:i'],
            'ends_at' => ['required', 'date_format:H:i'],
            'reason' => ['required', 'string', 'max:120'],
        ]);

        if ($data['ends_at'] <= $data['starts_at']) {
            return back()->with('error', 'El bloqueo tiene que terminar después de empezar.');
        }

        $block = BlockedPeriod::create([
            'court_id' => $data['court_id'] ?? null,
            'starts_at' => CarbonImmutable::parse($data['date'].' '.$data['starts_at']),
            'ends_at' => CarbonImmutable::parse($data['date'].' '.$data['ends_at']),
            'reason' => $data['reason'],
            'created_by' => $request->user()->id,
        ]);

        AuditLog::record('block.created', $block, $request->user(), [
            'reason' => $block->reason,
            'from' => $block->starts_at->format('Y-m-d H:i'),
            'to' => $block->ends_at->format('Y-m-d H:i'),
        ]);

        return back()->with('success', 'Horario bloqueado.');
    }

    public function destroy(Request $request, BlockedPeriod $blockedPeriod): RedirectResponse
    {
        Gate::authorize('delete', $blockedPeriod);

        AuditLog::record('block.deleted', $blockedPeriod, $request->user(), ['reason' => $blockedPeriod->reason]);
        $blockedPeriod->delete();

        return back()->with('success', 'Bloqueo eliminado.');
    }
}
