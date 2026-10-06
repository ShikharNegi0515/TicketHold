export const metadata = {
  title: 'Encore Tickets API — Docs',
  description: 'Interactive API documentation for the Encore Tickets Inventory API',
};

export default function DocsPage() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Encore Tickets API — Docs</title>
        <link
          rel="stylesheet"
          href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
        />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: #0a0a0a; }
          .topbar { display: none !important; }
          .swagger-ui .info .title { color: #f8f8f2 !important; }
          .swagger-ui { background: #0a0a0a; }
          .swagger-ui .scheme-container {
            background: #1a1a2e;
            box-shadow: none;
            border-bottom: 1px solid #333;
          }
          .swagger-ui .info { margin: 30px 0; }
          .swagger-ui .info .base-url { color: #8be9fd; }
          .swagger-ui .opblock-tag { color: #f8f8f2; border-bottom-color: #333; }
          .swagger-ui .opblock { border-radius: 8px; margin-bottom: 10px; }
          .swagger-ui .opblock .opblock-summary-description { color: #6272a4; }
          .custom-header {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            padding: 24px 40px;
            display: flex;
            align-items: center;
            gap: 16px;
            border-bottom: 1px solid #0f3460;
          }
          .custom-header h1 {
            color: #f8f8f2;
            font-family: 'Inter', sans-serif;
            font-size: 1.4rem;
            font-weight: 700;
          }
          .custom-header p {
            color: #8be9fd;
            font-family: 'Inter', sans-serif;
            font-size: 0.85rem;
            margin-top: 4px;
          }
          .badge {
            background: #50fa7b;
            color: #0a0a0a;
            font-size: 0.7rem;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 100px;
            font-family: monospace;
          }
        `}</style>
      </head>
      <body>
        <div className="custom-header">
          <div>
            <h1>🎟 Encore Tickets — Inventory API</h1>
            <p>Real-time ticket inventory with safe holds · Idempotent webhooks · Race-condition safe</p>
          </div>
          <span className="badge">v1.0.0</span>
        </div>

        <div id="swagger-ui" />

        <script
          src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"
          async
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('load', function() {
                const tryInit = setInterval(function() {
                  if (typeof SwaggerUIBundle === 'undefined') return;
                  clearInterval(tryInit);
                  SwaggerUIBundle({
                    url: '/api/docs/spec',
                    dom_id: '#swagger-ui',
                    deepLinking: true,
                    presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
                    layout: 'BaseLayout',
                    defaultModelsExpandDepth: 1,
                    defaultModelExpandDepth: 2,
                    docExpansion: 'list',
                    tryItOutEnabled: true,
                    filter: true,
                    syntaxHighlight: { theme: 'monokai' },
                  });
                }, 100);
              });
            `,
          }}
        />
      </body>
    </html>
  );
}
