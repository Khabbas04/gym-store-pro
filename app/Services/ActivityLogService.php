<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Throwable;

class ActivityLogService
{
    public function log(string $action, mixed $subject = null, ?User $actor = null, array $meta = []): void
    {
        if (! Schema::hasTable('activity_logs')) {
            return;
        }

        try {
            ActivityLog::query()->create([
                'actor_id' => $actor?->id,
                'action' => $action,
                'subject_type' => $subject ? get_class($subject) : null,
                'subject_id' => $subject?->id,
                'meta' => $meta ?: null,
            ]);
        } catch (Throwable) {
            // Never block business actions (e.g. product creation) بسبب مشاكل سجل النشاط.
        }
    }
}
