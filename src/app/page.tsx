import Link from 'next/link';

export default function Home() {
  const endpoints = [
    {
      method: 'GET',
      path: '/api/events/:event_id',
      description: 'Live inventory for an event and all its tiers',
      color: '#50fa7b',
    },
    {
      method: 'POST',
      path: '/api/events/:event_id/holds',
      description: 'Reserve tickets with a 10-minute TTL hold',
      color: '#8be9fd',
    },
    {
      method: 'POST',
      path: '/api/webhooks/payments',
      description: 'Idempotent handler for order.paid & order.refunded events',
      color: '#ffb86c',
    },
    {
      method: 'POST',
      path: '/api/holds/:hold_id/cancel',
      description: 'Cancel an active hold and return inventory',
      color: '#ff79c6',
    },
  ];

  const features = [
    {
      icon: '🔒',
      title: 'Race-Condition Safe',
      description: 'SELECT FOR UPDATE locks serialize concurrent hold requests. Zero overselling guaranteed.',
    },
    {
      icon: '♻️',
      title: 'Idempotent Webhooks',
      description: 'Duplicate webhook deliveries are deduplicated via the webhook_events table.',
    },
    {
      icon: '⏱️',
      title: 'Auto-Expiring Holds',
      description: 'Holds expire after 10 minutes. Inventory freed organically — no cron job needed.',
    },
    {
      icon: '🔀',
      title: 'Out-of-Order Delivery',
      description: 'Refund webhooks arriving before payment are gracefully reconciled.',
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html { scroll-behavior: smooth; }

        body {
          background: #060610;
          color: #f8f8f2;
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .noise {
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
        }

        .glow-orb-1 {
          position: fixed;
          top: -200px;
          left: -200px;
          width: 700px;
          height: 700px;
          background: radial-gradient(circle, rgba(80,250,123,0.08) 0%, transparent 70%);
          pointer-events: none;
          animation: float1 8s ease-in-out infinite;
        }
        .glow-orb-2 {
          position: fixed;
          bottom: -200px;
          right: -200px;
          width: 700px;
          height: 700px;
          background: radial-gradient(circle, rgba(139,233,253,0.07) 0%, transparent 70%);
          pointer-events: none;
          animation: float2 10s ease-in-out infinite;
        }

        @keyframes float1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(40px, 40px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-40px, -30px); }
        }

        .container {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* NAV */
        nav {
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(20px);
          background: rgba(6, 6, 16, 0.8);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .nav-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          font-size: 1.1rem;
          color: #f8f8f2;
          text-decoration: none;
        }
        .nav-logo span { color: #50fa7b; }
        .nav-links { display: flex; gap: 12px; }
        .nav-link {
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s;
          color: #a0a0b0;
        }
        .nav-link:hover { color: #f8f8f2; background: rgba(255,255,255,0.06); }
        .nav-cta {
          background: #50fa7b;
          color: #060610 !important;
          font-weight: 700 !important;
        }
        .nav-cta:hover { background: #69ff90 !important; transform: translateY(-1px); box-shadow: 0 4px 20px rgba(80,250,123,0.3); }

        /* HERO */
        .hero {
          padding: 100px 0 80px;
          text-align: center;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(80,250,123,0.1);
          border: 1px solid rgba(80,250,123,0.2);
          color: #50fa7b;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 6px 16px;
          border-radius: 100px;
          margin-bottom: 28px;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.05em;
        }
        .hero-badge::before { content: '●'; font-size: 0.5rem; }
        .hero-title {
          font-size: clamp(2.8rem, 6vw, 4.5rem);
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin-bottom: 20px;
          background: linear-gradient(135deg, #f8f8f2 0%, #a0a0c0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-title em {
          font-style: normal;
          background: linear-gradient(135deg, #50fa7b, #8be9fd);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-sub {
          font-size: 1.15rem;
          color: #6272a4;
          max-width: 560px;
          margin: 0 auto 40px;
          line-height: 1.7;
          font-weight: 400;
        }
        .hero-actions {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: #50fa7b;
          color: #060610;
          font-weight: 700;
          font-size: 0.95rem;
          border-radius: 10px;
          text-decoration: none;
          transition: all 0.2s;
          box-shadow: 0 0 0 0 rgba(80,250,123,0);
        }
        .btn-primary:hover {
          background: #69ff90;
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(80,250,123,0.35);
        }
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #f8f8f2;
          font-weight: 600;
          font-size: 0.95rem;
          border-radius: 10px;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-secondary:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.2);
          transform: translateY(-2px);
        }

        /* TERMINAL PREVIEW */
        .terminal {
          max-width: 680px;
          margin: 60px auto 0;
          background: #12121f;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 40px 80px rgba(0,0,0,0.5);
        }
        .terminal-bar {
          background: #1a1a2e;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .dot { width: 12px; height: 12px; border-radius: 50%; }
        .dot-red { background: #ff5555; }
        .dot-yellow { background: #f1fa8c; }
        .dot-green { background: #50fa7b; }
        .terminal-title { flex: 1; text-align: center; font-size: 0.75rem; color: #6272a4; font-family: 'JetBrains Mono', monospace; }
        .terminal-body { padding: 24px 28px; font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; line-height: 1.9; }
        .t-comment { color: #6272a4; }
        .t-cmd { color: #f8f8f2; }
        .t-cmd::before { content: '$ '; color: #50fa7b; }
        .t-method-get { color: #50fa7b; font-weight: 700; }
        .t-method-post { color: #8be9fd; font-weight: 700; }
        .t-url { color: #f8f8f2; }
        .t-success { color: #50fa7b; }
        .t-key { color: #ff79c6; }
        .t-val { color: #f1fa8c; }

        /* FEATURES */
        .section { padding: 80px 0; }
        .section-label {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #50fa7b;
          text-transform: uppercase;
          margin-bottom: 12px;
          font-family: 'JetBrains Mono', monospace;
        }
        .section-title {
          font-size: clamp(1.8rem, 3vw, 2.4rem);
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #f8f8f2;
          margin-bottom: 48px;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
        }
        .feature-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 28px;
          transition: all 0.25s;
        }
        .feature-card:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.14);
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        .feature-icon { font-size: 2rem; margin-bottom: 14px; }
        .feature-title { font-size: 1rem; font-weight: 700; color: #f8f8f2; margin-bottom: 8px; }
        .feature-desc { font-size: 0.875rem; color: #6272a4; line-height: 1.65; }

        /* ENDPOINTS */
        .endpoints-list { display: flex; flex-direction: column; gap: 12px; }
        .endpoint-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 18px 22px;
          text-decoration: none;
          transition: all 0.2s;
        }
        .endpoint-card:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.14);
          transform: translateX(4px);
        }
        .method-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          min-width: 52px;
          text-align: center;
          flex-shrink: 0;
        }
        .endpoint-path {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.88rem;
          color: #f8f8f2;
          flex-shrink: 0;
        }
        .endpoint-desc { font-size: 0.85rem; color: #6272a4; margin-left: auto; text-align: right; }

        /* FOOTER */
        footer {
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 32px 0;
          text-align: center;
        }
        .footer-text { color: #6272a4; font-size: 0.85rem; }
        .footer-text a { color: #8be9fd; text-decoration: none; }
        .footer-text a:hover { color: #f8f8f2; }

        /* DIVIDER */
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
          margin: 0;
        }
      `}</style>

      <div className="noise" />
      <div className="glow-orb-1" />
      <div className="glow-orb-2" />

      {/* NAV */}
      <nav>
        <div className="nav-inner">
          <a href="/" className="nav-logo">
            🎟 <span>Encore</span>Tickets
          </a>
          <div className="nav-links">
            <a href="#endpoints" className="nav-link">Endpoints</a>
            <a href="https://github.com/ShikharNegi0515/TicketHold" target="_blank" className="nav-link">GitHub</a>
            <a href="/docs" className="nav-link nav-cta">📖 API Docs</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div className="container">
        <section className="hero">
          <div className="hero-badge">v1.0.0 — Backend Trial Task</div>
          <h1 className="hero-title">
            Ticket Inventory<br />
            <em>Done Right.</em>
          </h1>
          <p className="hero-sub">
            Real-time ticket holds with race-condition safety, idempotent webhooks,
            and automatic expiry. Built with Next.js Route Handlers + TypeORM + PostgreSQL.
          </p>
          <div className="hero-actions">
            <a href="/docs" className="btn-primary">📖 Explore API Docs</a>
            <a href="https://github.com/ShikharNegi0515/TicketHold" target="_blank" className="btn-secondary">⭐ View on GitHub</a>
          </div>

          {/* Terminal */}
          <div className="terminal">
            <div className="terminal-bar">
              <div className="dot dot-red" />
              <div className="dot dot-yellow" />
              <div className="dot dot-green" />
              <div className="terminal-title">Scenario C — Race Condition Demo</div>
            </div>
            <div className="terminal-body">
              <div className="t-comment"># Two concurrent requests for the last 20 Student tickets</div>
              <div className="t-cmd"><span className="t-method-post">POST</span> <span className="t-url">/api/events/evt_002/holds</span> &</div>
              <div className="t-cmd"><span className="t-method-post">POST</span> <span className="t-url">/api/events/evt_002/holds</span> &</div>
              <br />
              <div className="t-comment"># Response 1 — Winner ✅</div>
              <div>{'{'} <span className="t-key">&quot;id&quot;</span>: <span className="t-val">&quot;9dc60e42-abdb-4f07-8b9c&quot;</span>, <span className="t-key">&quot;expires_at&quot;</span>: <span className="t-val">&quot;2026-10-07T...&quot;</span> {'}'}</div>
              <br />
              <div className="t-comment"># Response 2 — Blocked ❌</div>
              <div>{'{'} <span className="t-key">&quot;error&quot;</span>: {'{'} <span className="t-key">&quot;code&quot;</span>: <span className="t-val">&quot;OVERSOLD&quot;</span>, <span className="t-key">&quot;message&quot;</span>: <span className="t-val">&quot;Not enough available inventory&quot;</span> {'}'} {'}'}</div>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* FEATURES */}
        <section className="section">
          <div className="section-label">Design Decisions</div>
          <div className="section-title">Built for correctness, not just speed.</div>
          <div className="features-grid">
            {features.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.description}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="divider" />

        {/* ENDPOINTS */}
        <section className="section" id="endpoints">
          <div className="section-label">REST API</div>
          <div className="section-title">All endpoints, one click away.</div>
          <div className="endpoints-list">
            {endpoints.map((e) => (
              <a key={e.path} href="/docs" className="endpoint-card">
                <span
                  className="method-badge"
                  style={{
                    background: `${e.color}18`,
                    color: e.color,
                    border: `1px solid ${e.color}30`,
                  }}
                >
                  {e.method}
                </span>
                <span className="endpoint-path">{e.path}</span>
                <span className="endpoint-desc">{e.description}</span>
              </a>
            ))}
          </div>
        </section>
      </div>

      <div className="divider" />

      {/* FOOTER */}
      <footer>
        <div className="footer-text">
          Built by{' '}
          <a href="https://github.com/ShikharNegi0515" target="_blank">Shikhar Negi</a>
          {' '}· Backend Trial Task for{' '}
          <a href="https://getkwill.com" target="_blank">Kwill</a>
          {' '}· Powered by Next.js + TypeORM + PostgreSQL
        </div>
      </footer>
    </>
  );
}
