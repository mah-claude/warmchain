'use client'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body style={{ margin: 0, padding: 0, background: '#000', color: '#fff', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '24px', maxWidth: '400px' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>⚡</div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '12px' }}>Critical error</h1>
          <p style={{ color: '#9ca3af', marginBottom: '32px', lineHeight: 1.6 }}>
            Something went seriously wrong. Please refresh the page.
          </p>
          <button
            onClick={reset}
            style={{ padding: '12px 24px', background: '#10b981', color: '#000', fontWeight: 700, borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '14px' }}
          >
            Refresh page
          </button>
        </div>
      </body>
    </html>
  )
}
