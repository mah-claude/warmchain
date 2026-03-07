// Notion API client + block renderer for Warmchain
// All rendering is done programmatically — no raw HTML from Notion is used.

const NOTION_VERSION = '2022-06-28'
const NOTION_API = 'https://api.notion.com/v1'

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotionRichText = {
  type: string
  plain_text: string
  href: string | null
  annotations: {
    bold: boolean
    italic: boolean
    strikethrough: boolean
    underline: boolean
    code: boolean
    color: string
  }
  text?: { content: string; link: { url: string } | null }
}

export type NotionBlock = {
  id: string
  type: string
  has_children: boolean
  children?: NotionBlock[]
  [key: string]: unknown
}

export type NotionPage = {
  id: string
  url: string
  last_edited_time: string
  properties: {
    title?: { title: NotionRichText[] }
    Name?: { title: NotionRichText[] }
    [key: string]: unknown
  }
}

export type NotionTokenResponse = {
  access_token: string
  token_type: string
  bot_id: string
  workspace_id: string
  workspace_name: string
  workspace_icon: string | null
  owner: unknown
}

// ─── OAuth ────────────────────────────────────────────────────────────────────

export function generateOAuthUrl(state: string): string {
  const clientId = process.env.NOTION_CLIENT_ID
  const redirectUri = `https://warmchain.co/api/notion/callback`
  return `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&owner=user&state=${encodeURIComponent(state)}`
}

export async function exchangeCode(code: string): Promise<NotionTokenResponse> {
  const clientId = process.env.NOTION_CLIENT_ID!
  const clientSecret = process.env.NOTION_CLIENT_SECRET!
  const redirectUri = `https://warmchain.co/api/notion/callback`

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(`${NOTION_API}/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION,
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Notion token exchange failed: ${err}`)
  }

  return res.json()
}

// ─── Pages ────────────────────────────────────────────────────────────────────

export async function fetchWorkspacePages(accessToken: string): Promise<{ id: string; title: string; lastEdited: string }[]> {
  const res = await fetch(`${NOTION_API}/search`, {
    method: 'POST',
    headers: notionHeaders(accessToken),
    body: JSON.stringify({
      filter: { value: 'page', property: 'object' },
      sort: { direction: 'descending', timestamp: 'last_edited_time' },
      page_size: 50,
    }),
  })

  if (!res.ok) throw new Error(`Failed to fetch pages: ${res.status}`)

  const data = await res.json()
  return (data.results as NotionPage[]).map(page => ({
    id: page.id,
    title: extractPageTitle(page),
    lastEdited: page.last_edited_time,
  }))
}

function extractPageTitle(page: NotionPage): string {
  const titleProp = page.properties?.title || page.properties?.Name
  if (titleProp?.title && titleProp.title.length > 0) {
    return titleProp.title.map(t => t.plain_text).join('') || 'Untitled'
  }
  // Try any property with type 'title'
  for (const prop of Object.values(page.properties ?? {})) {
    const p = prop as { type?: string; title?: NotionRichText[] }
    if (p?.type === 'title' && p.title?.length) {
      return p.title.map(t => t.plain_text).join('') || 'Untitled'
    }
  }
  return 'Untitled'
}

// ─── Block fetching ───────────────────────────────────────────────────────────

async function fetchBlocks(accessToken: string, blockId: string, depth = 0): Promise<NotionBlock[]> {
  const MAX_DEPTH = 3
  const MAX_BLOCKS = 500

  const res = await fetch(`${NOTION_API}/blocks/${blockId}/children?page_size=100`, {
    headers: notionHeaders(accessToken),
  })

  if (!res.ok) {
    if (res.status === 404) return []
    throw new Error(`Failed to fetch blocks: ${res.status}`)
  }

  const data = await res.json()
  let blocks: NotionBlock[] = data.results ?? []

  // Handle pagination
  let cursor = data.next_cursor
  while (cursor && blocks.length < MAX_BLOCKS) {
    const pageRes = await fetch(`${NOTION_API}/blocks/${blockId}/children?page_size=100&start_cursor=${cursor}`, {
      headers: notionHeaders(accessToken),
    })
    if (!pageRes.ok) break
    const pageData = await pageRes.json()
    blocks = [...blocks, ...(pageData.results ?? [])]
    cursor = pageData.next_cursor
  }

  // Recursively fetch children (up to MAX_DEPTH)
  if (depth < MAX_DEPTH) {
    const withChildren = await Promise.all(
      blocks.map(async (block) => {
        if (block.has_children && shouldFetchChildren(block.type)) {
          // Small delay to respect rate limits
          await new Promise(r => setTimeout(r, 100))
          const children = await fetchBlocks(accessToken, block.id, depth + 1)
          return { ...block, children }
        }
        return block
      })
    )
    return withChildren
  }

  return blocks
}

function shouldFetchChildren(type: string): boolean {
  return ['toggle', 'bulleted_list_item', 'numbered_list_item', 'to_do', 'quote', 'callout'].includes(type)
}

// ─── Renderer ─────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function isSafeUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return ['http:', 'https:'].includes(u.protocol)
  } catch {
    return false
  }
}

function renderRichText(items: NotionRichText[]): string {
  return items.map(item => {
    let text = escapeHtml(item.plain_text)
    if (!text) return ''

    const { bold, italic, code, strikethrough, underline } = item.annotations
    if (code) text = `<code class="ncode">${text}</code>`
    if (bold) text = `<strong>${text}</strong>`
    if (italic) text = `<em>${text}</em>`
    if (strikethrough) text = `<s>${text}</s>`
    if (underline) text = `<u>${text}</u>`

    if (item.href && isSafeUrl(item.href)) {
      text = `<a href="${escapeAttr(item.href)}" target="_blank" rel="noopener noreferrer" class="nlink">${text}</a>`
    }

    return text
  }).join('')
}

export function renderNotionBlocks(blocks: NotionBlock[]): string {
  const chunks: string[] = []
  let i = 0

  while (i < blocks.length) {
    const block = blocks[i]

    // Group bulleted list items
    if (block.type === 'bulleted_list_item') {
      const items: string[] = []
      while (i < blocks.length && blocks[i].type === 'bulleted_list_item') {
        const b = blocks[i] as { type: string; bulleted_list_item?: { rich_text: NotionRichText[] }; children?: NotionBlock[] }
        const rt = renderRichText(b.bulleted_list_item?.rich_text ?? [])
        const childHtml = b.children ? renderNotionBlocks(b.children) : ''
        items.push(`<li>${rt}${childHtml}</li>`)
        i++
      }
      chunks.push(`<ul class="nlist">${items.join('')}</ul>`)
      continue
    }

    // Group numbered list items
    if (block.type === 'numbered_list_item') {
      const items: string[] = []
      while (i < blocks.length && blocks[i].type === 'numbered_list_item') {
        const b = blocks[i] as { type: string; numbered_list_item?: { rich_text: NotionRichText[] }; children?: NotionBlock[] }
        const rt = renderRichText(b.numbered_list_item?.rich_text ?? [])
        const childHtml = b.children ? renderNotionBlocks(b.children) : ''
        items.push(`<li>${rt}${childHtml}</li>`)
        i++
      }
      chunks.push(`<ol class="nlist">${items.join('')}</ol>`)
      continue
    }

    chunks.push(renderBlock(block))
    i++
  }

  return chunks.join('\n')
}

function renderBlock(block: NotionBlock): string {
  const b = block as Record<string, unknown>

  switch (block.type) {
    case 'paragraph': {
      const rt = renderRichText(((b.paragraph as Record<string, unknown>)?.rich_text as NotionRichText[]) ?? [])
      return rt ? `<p class="np">${rt}</p>` : '<p class="np">&nbsp;</p>'
    }
    case 'heading_1': {
      const rt = renderRichText(((b.heading_1 as Record<string, unknown>)?.rich_text as NotionRichText[]) ?? [])
      return `<h2 class="nh1">${rt}</h2>`
    }
    case 'heading_2': {
      const rt = renderRichText(((b.heading_2 as Record<string, unknown>)?.rich_text as NotionRichText[]) ?? [])
      return `<h3 class="nh2">${rt}</h3>`
    }
    case 'heading_3': {
      const rt = renderRichText(((b.heading_3 as Record<string, unknown>)?.rich_text as NotionRichText[]) ?? [])
      return `<h4 class="nh3">${rt}</h4>`
    }
    case 'quote': {
      const rt = renderRichText(((b.quote as Record<string, unknown>)?.rich_text as NotionRichText[]) ?? [])
      const childHtml = block.children ? renderNotionBlocks(block.children) : ''
      return `<blockquote class="nquote">${rt}${childHtml}</blockquote>`
    }
    case 'callout': {
      const callout = b.callout as Record<string, unknown>
      const icon = (callout?.icon as { type: string; emoji?: string })?.emoji ?? '💡'
      const rt = renderRichText((callout?.rich_text as NotionRichText[]) ?? [])
      const childHtml = block.children ? renderNotionBlocks(block.children) : ''
      return `<div class="ncallout"><span class="ncallout-icon">${escapeHtml(icon)}</span><div class="ncallout-body">${rt}${childHtml}</div></div>`
    }
    case 'to_do': {
      const todo = b.to_do as Record<string, unknown>
      const checked = todo?.checked ? 'checked' : ''
      const rt = renderRichText((todo?.rich_text as NotionRichText[]) ?? [])
      return `<div class="ntodo ${checked}"><span class="ntodo-box">${todo?.checked ? '☑' : '☐'}</span><span>${rt}</span></div>`
    }
    case 'toggle': {
      const toggle = b.toggle as Record<string, unknown>
      const rt = renderRichText((toggle?.rich_text as NotionRichText[]) ?? [])
      const childHtml = block.children ? renderNotionBlocks(block.children) : ''
      return `<details class="ntoggle"><summary class="ntoggle-summary">${rt}</summary><div class="ntoggle-body">${childHtml}</div></details>`
    }
    case 'code': {
      const code = b.code as Record<string, unknown>
      const lang = escapeHtml((code?.language as string) ?? '')
      const rt = (code?.rich_text as NotionRichText[]) ?? []
      const text = rt.map(t => escapeHtml(t.plain_text)).join('')
      return `<pre class="npre"><code class="npre-lang">${lang}</code><code>${text}</code></pre>`
    }
    case 'divider':
      return `<hr class="ndivider" />`
    case 'table': {
      const table = b.table as Record<string, unknown>
      const hasRowHeader = table?.has_row_header as boolean
      if (!block.children?.length) return ''
      const rows = block.children
      let html = '<table class="ntable"><tbody>'
      rows.forEach((row, idx) => {
        const cells = (((row as Record<string, unknown>).table_row as Record<string, unknown>)?.cells as NotionRichText[][]) ?? []
        const isHeader = hasRowHeader && idx === 0
        html += `<tr class="${isHeader ? 'ntable-header' : ''}">`
        cells.forEach(cell => {
          const tag = isHeader ? 'th' : 'td'
          html += `<${tag} class="ntable-cell">${renderRichText(cell)}</${tag}>`
        })
        html += '</tr>'
      })
      html += '</tbody></table>'
      return html
    }
    case 'image': {
      const img = b.image as Record<string, unknown>
      let src = ''
      if ((img?.type as string) === 'external') {
        src = ((img?.external as Record<string, unknown>)?.url as string) ?? ''
      } else if ((img?.type as string) === 'file') {
        src = ((img?.file as Record<string, unknown>)?.url as string) ?? ''
      }
      const caption = renderRichText((img?.caption as NotionRichText[]) ?? [])
      if (!src || !isSafeUrl(src)) return ''
      return `<figure class="nfigure"><img src="${escapeAttr(src)}" alt="${caption ? caption.replace(/<[^>]+>/g, '') : 'Image'}" class="nimg" loading="lazy" />${caption ? `<figcaption class="nfigcaption">${caption}</figcaption>` : ''}</figure>`
    }
    case 'bookmark': {
      const bm = b.bookmark as Record<string, unknown>
      const url = (bm?.url as string) ?? ''
      const caption = renderRichText((bm?.caption as NotionRichText[]) ?? [])
      if (!url || !isSafeUrl(url)) return ''
      const display = caption || escapeHtml(url.replace(/^https?:\/\//, '').replace(/\/$/, ''))
      return `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer" class="nbookmark">${display}</a>`
    }
    case 'child_page': {
      const cp = b.child_page as Record<string, unknown>
      const title = escapeHtml((cp?.title as string) ?? 'Untitled')
      return `<div class="nchild-page">📄 ${title}</div>`
    }
    default:
      // Fallback: try to extract rich_text
      const fb = b[block.type] as Record<string, unknown>
      if (fb?.rich_text) {
        const rt = renderRichText((fb.rich_text as NotionRichText[]) ?? [])
        return rt ? `<p class="np">${rt}</p>` : ''
      }
      return ''
  }
}

// ─── Full sync ─────────────────────────────────────────────────────────────────

export async function syncNotionPage(accessToken: string, pageId: string): Promise<{
  rendered_html: string
  blocks_json: NotionBlock[]
  page_title: string
  word_count: number
}> {
  // Fetch page metadata
  const pageRes = await fetch(`${NOTION_API}/pages/${pageId}`, {
    headers: notionHeaders(accessToken),
  })
  if (!pageRes.ok) throw new Error(`Page not found: ${pageRes.status}`)
  const page = await pageRes.json() as NotionPage

  const page_title = extractPageTitle(page)

  // Fetch all blocks
  const blocks = await fetchBlocks(accessToken, pageId)

  // Render to HTML
  const rendered_html = renderNotionBlocks(blocks)

  // Count words
  const word_count = blocks.reduce((sum, b) => {
    const bt = b[b.type] as Record<string, unknown>
    const rt = bt?.rich_text as NotionRichText[]
    return sum + (rt?.map(t => t.plain_text).join(' ').split(/\s+/).filter(Boolean).length ?? 0)
  }, 0)

  return { rendered_html, blocks_json: blocks, page_title, word_count }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function notionHeaders(accessToken: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  }
}
