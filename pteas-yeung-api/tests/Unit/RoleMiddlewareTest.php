<?php

namespace Tests\Unit;

use App\Http\Middleware\RoleMiddleware;
use App\Models\User;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class RoleMiddlewareTest extends TestCase
{
    public function test_unauthenticated_request_is_rejected_with_401(): void
    {
        $middleware = new RoleMiddleware;
        $request = Request::create('/api/admin/dashboard', 'GET');

        $response = $middleware->handle($request, function () {
            return new Response('OK');
        }, 'super_admin');

        $this->assertEquals(401, $response->getStatusCode());
    }

    public function test_user_with_wrong_role_is_rejected_with_403(): void
    {
        $middleware = new RoleMiddleware;
        $request = Request::create('/api/admin/dashboard', 'GET');

        $user = new User(['role' => 'tenant']);
        $request->setUserResolver(fn () => $user);

        $response = $middleware->handle($request, function () {
            return new Response('OK');
        }, 'super_admin');

        $this->assertEquals(403, $response->getStatusCode());
    }

    public function test_user_with_matching_role_passes(): void
    {
        $middleware = new RoleMiddleware;
        $request = Request::create('/api/admin/dashboard', 'GET');

        $user = new User(['role' => 'super_admin']);
        $request->setUserResolver(fn () => $user);

        $response = $middleware->handle($request, function () {
            return new Response('OK');
        }, 'super_admin');

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('OK', $response->getContent());
    }

    public function test_user_with_multi_role_matching_passes(): void
    {
        $middleware = new RoleMiddleware;
        $request = Request::create('/api/rooms', 'GET');

        $user = new User(['role' => 'owner']);
        $request->setUserResolver(fn () => $user);

        $response = $middleware->handle($request, function () {
            return new Response('OK');
        }, 'super_admin,owner');

        $this->assertEquals(200, $response->getStatusCode());
    }
}
