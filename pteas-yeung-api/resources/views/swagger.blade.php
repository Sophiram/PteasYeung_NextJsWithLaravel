<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PteasYeung API — Swagger UI</title>
    <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
    <link rel="icon" type="image/png" href="/favicon.ico" />
    <style>
        html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }
        *, *:before, *:after {
            box-sizing: inherit;
        }
        body {
            margin: 0;
            background: #fafafa;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .topbar-nav {
            background: #1e293b;
            color: #f8fafc;
            padding: 12px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .topbar-nav .brand {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 700;
            font-size: 16px;
            color: #fff;
            text-decoration: none;
        }
        .topbar-nav .brand span {
            color: #818cf8;
            font-size: 12px;
            background: rgba(129, 140, 248, 0.15);
            padding: 2px 8px;
            border-radius: 6px;
        }
        .topbar-nav .links {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .topbar-nav .links a {
            color: #cbd5e1;
            text-decoration: none;
            font-size: 13px;
            font-weight: 600;
            padding: 6px 12px;
            border-radius: 8px;
            transition: all 0.15s ease;
        }
        .topbar-nav .links a:hover {
            color: #ffffff;
            background: rgba(255, 255, 255, 0.1);
        }
        .topbar-nav .links a.active {
            background: #4f46e5;
            color: #fff;
        }
        .swagger-ui .topbar {
            display: none !important;
        }
    </style>
</head>
<body>
    <div class="topbar-nav">
        <a href="/" class="brand">
            PteasYeung API <span>v1.0.0</span>
        </a>
        <div class="links">
            <a href="/docs/api">🟣 Scalar UI</a>
            <a href="/docs/swagger" class="active">🟢 Swagger UI</a>
            <a href="/docs/api.json" target="_blank">📄 OpenAPI Spec (JSON)</a>
        </div>
    </div>

    <div id="swagger-ui"></div>

    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js" charset="UTF-8"></script>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
    <script>
        window.onload = function() {
            window.ui = SwaggerUIBundle({
                url: "/docs/api.json",
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                persistAuthorization: true,
                displayRequestDuration: true,
                filter: true,
                tryItOutEnabled: true,
            });
        };
    </script>
</body>
</html>
