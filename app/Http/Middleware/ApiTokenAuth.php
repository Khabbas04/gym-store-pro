<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiTokenAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $plainToken = $request->bearerToken();

        if (! $plainToken) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $hashedToken = hash('sha256', $plainToken);
        $user = User::query()->where('api_token', $hashedToken)->first();

        if (! $user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $request->setUserResolver(static fn () => $user);

        return $next($request);
    }
}
