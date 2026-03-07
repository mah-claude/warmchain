/**
 * Security tests for the Notion block renderer.
 * Run with: node --experimental-vm-modules lib/notion.security.test.mjs
 *
 * Covers the renderer's XSS defenses without a test framework dependency.
 * Each test creates NotionBlock structures that an adversarial Notion API
 * response could return, then verifies the renderer strips/escapes them.
 */

import { createRequire } from 'module'

// ─── Inline the escapeHtml, isSafeUrl, renderRichText, renderBlock logic ──────
// We duplicate the core logic here to test it in isolation from Next.js build.

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function isSafeUrl(url) {
  try {
    const u = new URL(url)
    return ['http:', 'https:'].includes(u.protocol)
  } catch {
    return false
  }
}

function renderRichText(items) {
  return items.map(item => {
    let text = escapeHtml(item.plain_text)
    if (!text) return ''
    const { bold, italic, code, strikethrough, underline } = item.annotations ?? {}
    if (code) text = `<code class="ncode">${text}</code>`
    if (bold) text = `<strong>${text}</strong>`
    if (italic) text = `<em>${text}</em>`
    if (strikethrough) text = `<s>${text}</s>`
    if (underline) text = `<u>${text}</u>`
    if (item.href && isSafeUrl(item.href)) {
      text = `<a href="${escapeAttr(item.href)}" target="_blank" rel="noopener noreferrer">${text}</a>`
    }
    return text
  }).join('')
}

// ─── Test harness ─────────────────────────────────────────────────────────────
let passed = 0
let failed = 0

function assert(condition, name) {
  if (condition) {
    console.log(`  ✓ ${name}`)
    passed++
  } else {
    console.error(`  ✗ FAIL: ${name}`)
    failed++
  }
}

function assertNotContains(html, pattern, name) {
  const re = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern
  assert(!re.test(html), name)
}

function assertContains(html, pattern, name) {
  const re = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern
  assert(re.test(html), name)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

console.log('\n=== Notion Renderer XSS Security Tests ===\n')

// 1. Script tag injection via plain_text
console.log('1. Script tag injection in plain_text')
{
  const items = [{ plain_text: '<script>alert(1)</script>', annotations: {}, href: null }]
  const html = renderRichText(items)
  assertNotContains(html, /<script/i, 'script tag stripped from plain_text')
  assertContains(html, /&lt;script/i, 'script tag HTML-encoded')
}

// 2. XSS via href — javascript: protocol
console.log('2. javascript: URL in link href')
{
  const items = [{ plain_text: 'click me', annotations: {}, href: 'javascript:alert(document.cookie)' }]
  const html = renderRichText(items)
  assertNotContains(html, /javascript:/i, 'javascript: protocol blocked')
  assertNotContains(html, /<a\s/, 'no anchor tag rendered for javascript: URL')
}

// 3. XSS via href — data: protocol
console.log('3. data: URL in link href')
{
  const items = [{ plain_text: 'click me', annotations: {}, href: 'data:text/html,<script>alert(1)</script>' }]
  const html = renderRichText(items)
  assertNotContains(html, /data:/i, 'data: protocol blocked')
}

// 4. XSS via href — uppercase JAVASCRIPT:
console.log('4. Uppercase JAVASCRIPT: URL bypass attempt')
{
  const items = [{ plain_text: 'click me', annotations: {}, href: 'JAVASCRIPT:alert(1)' }]
  const html = renderRichText(items)
  assertNotContains(html, /JAVASCRIPT:/i, 'uppercase JAVASCRIPT: blocked by URL parser')
}

// 5. Event handler injection via plain_text
console.log('5. Event handler injection in plain_text')
{
  const items = [{ plain_text: '" onmouseover="alert(1)"', annotations: {}, href: null }]
  const html = renderRichText(items)
  // "onmouseover" appears in output but ONLY as escaped text content, never as an HTML attribute.
  // Output: &quot; onmouseover=&quot;alert(1)&quot; — harmless literal text.
  // /<[^>]*onmouseover/ would only match if onmouseover appeared inside an actual HTML tag.
  assertNotContains(html, /<[^>]*onmouseover/i, 'onmouseover is not an HTML attribute (not inside a tag)')
  assertContains(html, /onmouseover=&quot;/i, 'onmouseover appears only as escaped text content')
  assertContains(html, /&quot;/, 'double quotes encoded as &quot;')
}

// 6. IMG onerror injection attempt
console.log('6. IMG onerror via plain_text')
{
  const items = [{ plain_text: '<img src=x onerror=alert(1)>', annotations: {}, href: null }]
  const html = renderRichText(items)
  assertNotContains(html, /<img/i, 'img tag stripped from plain_text')
  assertContains(html, /&lt;img/i, 'img tag HTML-encoded')
}

// 7. Prototype pollution attempt via plain_text
console.log('7. Prototype pollution via plain_text')
{
  const items = [{ plain_text: '__proto__[admin]=true', annotations: {}, href: null }]
  const html = renderRichText(items)
  assertContains(html, /__proto__/, 'proto text preserved as safe text')
  assert(!Object.prototype.admin, 'prototype not polluted')
}

// 8. Null bytes in plain_text
console.log('8. Null bytes in plain_text')
{
  const items = [{ plain_text: 'safe\x00<script>evil</script>', annotations: {}, href: null }]
  const html = renderRichText(items)
  assertNotContains(html, /<script/i, 'script after null byte is escaped')
}

// 9. isSafeUrl — known safe URLs
console.log('9. isSafeUrl — safe URL acceptance')
{
  assert(isSafeUrl('https://notion.so/page'), 'https: URL accepted')
  assert(isSafeUrl('http://example.com'), 'http: URL accepted')
  assert(!isSafeUrl('javascript:void(0)'), 'javascript: rejected')
  assert(!isSafeUrl('data:text/html,test'), 'data: rejected')
  assert(!isSafeUrl('vbscript:msgbox(1)'), 'vbscript: rejected')
  assert(!isSafeUrl('file:///etc/passwd'), 'file: rejected')
  assert(!isSafeUrl('//evil.com'), 'protocol-relative URL rejected (no protocol)')
  assert(!isSafeUrl('not-a-url'), 'non-URL rejected')
  assert(!isSafeUrl(''), 'empty string rejected')
}

// 10. HTML attribute injection via href
console.log('10. HTML attribute injection via href')
{
  const items = [{
    plain_text: 'link',
    annotations: {},
    href: 'https://example.com" onmouseover="alert(1)',
  }]
  const html = renderRichText(items)
  assertNotContains(html, /onmouseover/i, 'onmouseover not injected via href')
  // new URL('https://example.com" onmouseover=...') throws "Invalid URL" because `"` is illegal.
  // isSafeUrl() returns false → no <a> tag is rendered at all (safer than just escaping the quote).
  assertNotContains(html, /<a\s/, 'no anchor rendered for URL-invalid href (isSafeUrl rejects it)')
  assert(html === 'link', 'output is plain escaped text with no link wrapping')
}

// 11. Unicode/homograph attack in URL
console.log('11. Unicode escape in URL')
{
  // This is a valid https URL, just with unicode — should be accepted (browsers handle it)
  assert(isSafeUrl('https://аpple.com'), 'unicode https URL accepted (browser handles IDN)')
  assert(!isSafeUrl('javascript\u003aalert(1)'), 'unicode-escaped javascript: still rejected by URL parser')
}

// 12. Bold/italic annotations — ensure nesting doesn't break HTML
console.log('12. Annotation nesting safety')
{
  const items = [{
    plain_text: '<b>not bold</b>',
    annotations: { bold: true, italic: false, code: false, strikethrough: false, underline: false },
    href: null,
  }]
  const html = renderRichText(items)
  // The plain_text content is escaped, then wrapped in <strong>
  assertContains(html, /<strong>/, 'strong tag added by annotation')
  assertContains(html, /&lt;b&gt;/, 'inner HTML tags are escaped')
  assertNotContains(html, /<b>not bold/, 'raw <b> tag NOT present in output')
}

// 13. Empty/missing rich_text arrays
console.log('13. Edge cases — empty inputs')
{
  assert(renderRichText([]) === '', 'empty rich_text returns empty string')
  assert(renderRichText([{ plain_text: '', annotations: {}, href: null }]) === '', 'blank plain_text returns empty')
}

// 14. Code block language field injection
console.log('14. Code block language injection')
{
  // Simulating what renderBlock would do with language injection
  const lang = escapeHtml('<script>alert(1)</script>')
  assertNotContains(lang, /<script/i, 'code block language field is HTML-escaped')
  assertContains(lang, /&lt;script/i, 'script encoded correctly')
}

// ─── Results ──────────────────────────────────────────────────────────────────
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`)

if (failed > 0) {
  process.exit(1)
}
