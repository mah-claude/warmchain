import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { syncNotionPage } from '@/lib/notion'

const SYNC_COOLDOWN_SECONDS = 30

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get founder username
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('user_id', user.id)
    .single()
  if (!profile) return NextResponse.json({ error: 'Founder profile not found' }, { status: 404 })

  // Get Notion connection
  const { data: conn } = await supabase
    .from('notion_connections')
    .select('access_token, selected_page_id, selected_page_title, last_synced_at')
    .eq('user_id', user.id)
    .single()
  if (!conn) return NextResponse.json({ error: 'Notion not connected' }, { status: 404 })

  // Allow overriding the page from request body
  const body = await req.json().catch(() => ({}))
  const pageId: string = body.page_id ?? conn.selected_page_id
  if (!pageId) return NextResponse.json({ error: 'No page selected' }, { status: 400 })

  // Rate limit: 30s cooldown per user
  if (conn.last_synced_at) {
    const elapsed = (Date.now() - new Date(conn.last_synced_at).getTime()) / 1000
    if (elapsed < SYNC_COOLDOWN_SECONDS) {
      return NextResponse.json({
        error: 'rate_limited',
        retry_after: Math.ceil(SYNC_COOLDOWN_SECONDS - elapsed),
      }, { status: 429 })
    }
  }

  try {
    const { rendered_html, blocks_json, page_title, word_count } = await syncNotionPage(conn.access_token, pageId)

    // Get current max version for this user
    const { data: latest } = await supabase
      .from('notion_snapshots')
      .select('version')
      .eq('user_id', user.id)
      .order('version', { ascending: false })
      .limit(1)
      .single()
    const nextVersion = (latest?.version ?? 0) + 1

    // Mark all previous snapshots as not current
    await supabase
      .from('notion_snapshots')
      .update({ is_current: false })
      .eq('user_id', user.id)

    // Insert new snapshot
    await supabase.from('notion_snapshots').insert([{
      user_id: user.id,
      founder_username: profile.username,
      page_id: pageId,
      page_title,
      rendered_html,
      blocks_json: blocks_json as unknown as Record<string, unknown>,
      word_count,
      version: nextVersion,
      is_current: true,
    }])

    // Prune old snapshots (keep last 10)
    const { data: oldSnaps } = await supabase
      .from('notion_snapshots')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_current', false)
      .order('synced_at', { ascending: true })
    if (oldSnaps && oldSnaps.length > 9) {
      const toDelete = oldSnaps.slice(0, oldSnaps.length - 9).map(s => s.id)
      await supabase.from('notion_snapshots').delete().in('id', toDelete)
    }

    // Update connection metadata
    const updateData: Record<string, unknown> = {
      last_synced_at: new Date().toISOString(),
      sync_error: null,
      updated_at: new Date().toISOString(),
    }
    if (body.page_id) {
      updateData.selected_page_id = pageId
      updateData.selected_page_title = page_title
    }
    await supabase.from('notion_connections').update(updateData).eq('user_id', user.id)

    // Enable public visibility on first successful sync (opt-in by action).
    // Founders can disable via settings later; syncing implies intent to share.
    await supabase
      .from('profiles')
      .update({ notion_enabled: true })
      .eq('user_id', user.id)

    return NextResponse.json({ ok: true, version: nextVersion, page_title, word_count, synced_at: new Date().toISOString() })
  } catch (err) {
    console.error('Notion sync error:', err)
    const msg = err instanceof Error ? err.message : 'Sync failed'
    await supabase.from('notion_connections').update({ sync_error: msg, updated_at: new Date().toISOString() }).eq('user_id', user.id)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// Update page selection (without full sync)
export async function PATCH(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { page_id, page_title } = await req.json()
  if (!page_id) return NextResponse.json({ error: 'page_id required' }, { status: 400 })

  await supabase.from('notion_connections').update({
    selected_page_id: page_id,
    selected_page_title: page_title ?? null,
    updated_at: new Date().toISOString(),
  }).eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
