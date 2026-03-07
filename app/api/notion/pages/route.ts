import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchWorkspacePages } from '@/lib/notion'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get the user's Notion connection
  const { data: conn, error: connErr } = await supabase
    .from('notion_connections')
    .select('access_token')
    .eq('user_id', user.id)
    .single()

  if (connErr || !conn) {
    return NextResponse.json({ error: 'Notion not connected' }, { status: 404 })
  }

  try {
    const pages = await fetchWorkspacePages(conn.access_token)
    return NextResponse.json({ pages })
  } catch (err) {
    console.error('Notion pages error:', err)
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 })
  }
}
