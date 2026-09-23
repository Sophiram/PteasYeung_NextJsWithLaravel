<?php

namespace Tests\Feature;

use Tests\TestCase;

class DocsTest extends TestCase
{
    public function test_api_documentation_json_endpoint_is_accessible(): void
    {
        $response = $this->get('/docs/api.json');

        $response->assertStatus(200);
        $response->assertJsonPath('openapi', '3.1.0');
        $response->assertJsonPath('info.title', 'PteasYeung API Reference');
    }

    public function test_scalar_docs_page_is_accessible(): void
    {
        $response = $this->get('/docs/api');

        $response->assertStatus(200);
    }

    public function test_swagger_docs_page_is_accessible(): void
    {
        $response = $this->get('/docs/swagger');

        $response->assertStatus(200);
        $response->assertSee('SwaggerUIBundle');
    }
}
