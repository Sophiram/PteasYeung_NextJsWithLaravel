<?php

use App\Http\Middleware\RoleMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

if (class_exists(\Illuminate\Foundation\Console\ServeCommand::class) && ! in_array('PHPRC', \Illuminate\Foundation\Console\ServeCommand::$passthroughVariables, true)) {
    \Illuminate\Foundation\Console\ServeCommand::$passthroughVariables[] = 'PHPRC';
}

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->removeFromGroup('web', \Illuminate\Cookie\Middleware\EncryptCookies::class);
        $middleware->append(\App\Http\Middleware\SecurityHeadersMiddleware::class);
        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => \App\Http\Middleware\PermissionMiddleware::class,
        ]);
        $middleware->redirectGuestsTo(fn () => response()->json(['message' => 'Unauthenticated.'], 401));
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
