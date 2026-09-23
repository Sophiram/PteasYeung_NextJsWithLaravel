<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// 📚 API Documentation Routes (Scalar & Swagger)
Route::get('/docs/swagger', function () {
    return view('swagger');
})->name('docs.swagger');

Route::get('/docs/scalar', function () {
    return redirect('/docs/api');
})->name('docs.scalar');

Route::get('/docs', function () {
    return redirect('/docs/api');
});

Route::get('/api-docs', function () {
    return redirect('/docs/api');
});
