import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const FROM = 'Warmchain <hello@warmchain.com>'

// ─── HTML email templates ──────────────────────────────────────────────────────

function base(content: string, preheader: string = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Warmchain</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#fff;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : ''}
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;min-height:100vh;">
<tr><td align="center" style="padding:40px 16px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
  <!-- Logo -->
  <tr><td style="padding-bottom:32px;">
    <a href="https://warmchain.com" style="text-decoration:none;">
      <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Warmchain</span>
    </a>
  </td></tr>
  <!-- Card -->
  <tr><td style="background-color:#141414;border:1px solid #262626;border-radius:16px;padding:40px;">
    ${content}
  </td></tr>
  <!-- Footer -->
  <tr><td style="padding-top:32px;text-align:center;">
    <p style="margin:0;font-size:12px;color:#404040;line-height:1.6;">
      © 2026 Warmchain · <a href="https://warmchain.com/privacy" style="color:#404040;">Privacy</a> · <a href="https://warmchain.com/terms" style="color:#404040;">Terms</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

function btn(text: string, href: string) {
  return `<a href="${href}" style="display:inline-block;padding:14px 28px;background-color:#10b981;color:#000000;font-weight:700;font-size:14px;text-decoration:none;border-radius:12px;margin-top:24px;">${text}</a>`
}

function tag(text: string) {
  return `<span style="display:inline-block;padding:4px 12px;background-color:rgba(16,185,129,0.1);color:#10b981;font-size:12px;font-weight:600;border-radius:999px;border:1px solid rgba(16,185,129,0.2);margin:2px;">${text}</span>`
}

function welcome(email: string, userType: 'founder' | 'connector') {
  const isFounder = userType === 'founder'
  const content = `
    <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#fff;letter-spacing:-0.5px;">
      Welcome to Warmchain ${isFounder ? '👔' : '🤝'}
    </h1>
    <p style="margin:0 0 24px;font-size:16px;color:#9ca3af;line-height:1.6;">
      ${isFounder
        ? "You're in. Now let's build your startup profile so connectors can say yes in 30 seconds."
        : "You're in. Build your connector profile and start helping founders get warm intros."}
    </p>
    <div style="background-color:#0f1f1a;border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 16px;font-size:12px;font-weight:600;color:#10b981;text-transform:uppercase;letter-spacing:0.1em;">
        ${isFounder ? 'Getting started' : 'Next steps'}
      </p>
      ${isFounder ? `
      <p style="margin:0 0 8px;font-size:14px;color:#d1d5db;">✓ Fill in your company details and one-liner</p>
      <p style="margin:0 0 8px;font-size:14px;color:#d1d5db;">✓ Add your stage, traction, and the ask</p>
      <p style="margin:0;font-size:14px;color:#d1d5db;">✓ Share your link with every intro request</p>
      ` : `
      <p style="margin:0 0 8px;font-size:14px;color:#d1d5db;">✓ Build your connector profile</p>
      <p style="margin:0 0 8px;font-size:14px;color:#d1d5db;">✓ Set your expertise and intro types</p>
      <p style="margin:0;font-size:14px;color:#d1d5db;">✓ Review and respond to founder requests</p>
      `}
    </div>
    ${btn(isFounder ? 'Build Your Profile →' : 'Create Connector Profile →', isFounder ? 'https://warmchain.com/builder' : 'https://warmchain.com/connector-builder')}
    <p style="margin:32px 0 0;font-size:13px;color:#6b7280;">
      Any questions? Reply to this email — we read every one.
    </p>`
  return base(content, isFounder ? 'Your startup profile is waiting — set up in 10 minutes.' : 'Help founders get warm intros.')
}

function newRequest(connectorName: string, founderCompany: string, founderUsername: string, message: string) {
  const content = `
    <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#fff;letter-spacing:-0.5px;">
      New intro request 📬
    </h1>
    <p style="margin:0 0 24px;font-size:16px;color:#9ca3af;line-height:1.6;">
      Hey ${connectorName.split(' ')[0]}, <strong style="color:#fff;">${founderCompany}</strong> just sent you an intro request.
    </p>
    <div style="background-color:#1a1600;border:1px solid rgba(234,179,8,0.2);border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#eab308;text-transform:uppercase;letter-spacing:0.1em;">Their message</p>
      <p style="margin:0;font-size:15px;color:#d1d5db;line-height:1.7;font-style:italic;">"${message.slice(0, 300)}${message.length > 300 ? '…' : ''}"</p>
    </div>
    ${btn('Review Request →', `https://warmchain.com/f/${founderUsername}`)}
    <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">
      Accept or decline from your <a href="https://warmchain.com/dashboard" style="color:#10b981;">dashboard</a>.
    </p>`
  return base(content, `${founderCompany} wants your help with a warm intro.`)
}

function requestAccepted(founderCompany: string, connectorName: string, connectorUsername: string) {
  const content = `
    <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#fff;letter-spacing:-0.5px;">
      Your request was accepted! ✅
    </h1>
    <p style="margin:0 0 24px;font-size:16px;color:#9ca3af;line-height:1.6;">
      Great news — <strong style="color:#fff;">${connectorName}</strong> accepted your intro request.
    </p>
    <div style="background-color:#0f1f1a;border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#10b981;text-transform:uppercase;letter-spacing:0.1em;">What's next</p>
      <p style="margin:0 0 8px;font-size:14px;color:#d1d5db;">1. Reach out to ${connectorName.split(' ')[0]} directly via their profile links</p>
      <p style="margin:0 0 8px;font-size:14px;color:#d1d5db;">2. Keep your message brief — they already know your story from your profile</p>
      <p style="margin:0;font-size:14px;color:#d1d5db;">3. Close the loop after the intro happens</p>
    </div>
    ${btn(`View ${connectorName.split(' ')[0]}'s Profile →`, `https://warmchain.com/c/${connectorUsername}`)}
    <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">
      Track all your requests from your <a href="https://warmchain.com/dashboard" style="color:#10b981;">dashboard</a>.
    </p>`
  return base(content, `${connectorName} is ready to help you.`)
}

function requestDeclined(founderCompany: string, connectorName: string) {
  const content = `
    <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#fff;letter-spacing:-0.5px;">
      A response on your request
    </h1>
    <p style="margin:0 0 24px;font-size:16px;color:#9ca3af;line-height:1.6;">
      ${connectorName} wasn't able to help with this particular intro right now. Don't be discouraged — there are more connectors who can help.
    </p>
    <div style="background-color:#1a0f0f;border:1px solid rgba(239,68,68,0.15);border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#f87171;text-transform:uppercase;letter-spacing:0.1em;">Keep going</p>
      <p style="margin:0 0 8px;font-size:14px;color:#d1d5db;">✓ Browse other connectors who match your needs</p>
      <p style="margin:0 0 8px;font-size:14px;color:#d1d5db;">✓ Update your profile with recent traction</p>
      <p style="margin:0;font-size:14px;color:#d1d5db;">✓ The right intro is one request away</p>
    </div>
    ${btn('Browse More Connectors →', 'https://warmchain.com/connectors')}
    <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">
      View all your requests in your <a href="https://warmchain.com/dashboard" style="color:#10b981;">dashboard</a>.
    </p>`
  return base(content, 'Keep reaching out — the right connector is out there.')
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    // Silently succeed if Resend not configured — don't break the app
    return NextResponse.json({ ok: true, skipped: true })
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const body = await req.json()
    const { type, to, subject, ...data } = body

    // Welcome emails are unauthenticated (no session exists at signup time)
    // All other email types require a valid user Bearer token
    if (type !== 'welcome') {
      const authHeader = req.headers.get('authorization')
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
      if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const { data: { user }, error: authError } = await serviceClient.auth.getUser(token)
      if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let html = ''
    let emailSubject = subject ?? 'Warmchain'
    let emailTo = to

    // If a user_id is provided instead of a direct email, look it up
    if (data.founder_user_id && !emailTo) {
      const { data: { user: targetUser } } = await serviceClient.auth.admin.getUserById(data.founder_user_id)
      emailTo = targetUser?.email ?? null
    }

    switch (type) {
      case 'welcome':
        html = welcome(data.email, data.user_type)
        emailSubject = `Welcome to Warmchain!`
        emailTo = data.email
        break
      case 'new_request':
        html = newRequest(data.connector_name, data.founder_company, data.founder_username, data.message)
        emailSubject = `New intro request from ${data.founder_company}`
        break
      case 'request_accepted':
        html = requestAccepted(data.founder_company, data.connector_name, data.connector_username)
        emailSubject = `${data.connector_name} accepted your intro request! 🎉`
        break
      case 'request_declined':
        html = requestDeclined(data.founder_company, data.connector_name)
        emailSubject = `Update on your intro request to ${data.connector_name}`
        break
      default:
        return NextResponse.json({ error: 'Unknown email type' }, { status: 400 })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: emailTo, subject: emailSubject, html }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Resend error:', err)
      return NextResponse.json({ error: 'Email send failed' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Email route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
