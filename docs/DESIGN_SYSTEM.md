# Warmchain — Design System

## Visual Direction

**Theme**: Premium light
- Background: `#f8f9fa` (off-white/light neutral) with subtle gradient to `#ffffff`
- Card surface: `#ffffff` with soft shadow (`shadow-sm` or `0 1px 3px rgba(0,0,0,0.08)`)
- Card border: `border border-gray-100` or `border border-gray-200`
- Primary text: `#111827` (gray-900)
- Secondary text: `#6b7280` (gray-500)
- Muted text: `#9ca3af` (gray-400)
- Accent: Emerald — `#10b981` (emerald-500), used restrained
- Hover accents: `emerald-600` / `emerald-400`
- Danger: `#ef4444` (red-500)

## Typography

| Element | Style |
|---------|-------|
| H1 (page title) | `text-3xl font-bold text-gray-900` |
| H2 (section) | `text-xl font-semibold text-gray-800` |
| H3 (card title) | `text-base font-semibold text-gray-900` |
| Body | `text-sm text-gray-700 leading-relaxed` |
| Caption / label | `text-xs text-gray-500 font-medium` |
| Mono (username) | `font-mono text-sm` |

## Color Palette

```
Primary brand:   emerald-500 (#10b981)
Brand hover:     emerald-600 (#059669)
Brand light bg:  emerald-50  (#ecfdf5)
Brand border:    emerald-200 (#a7f3d0)

Neutral bg:      gray-50  (#f9fafb)
Card bg:         white    (#ffffff)
Border light:    gray-100 (#f3f4f6)
Border medium:   gray-200 (#e5e7eb)
Border dark:     gray-300 (#d1d5db)

Text primary:    gray-900 (#111827)
Text secondary:  gray-600 (#4b5563)
Text muted:      gray-400 (#9ca3af)

Status pending:  amber-100 bg / amber-700 text
Status accepted: emerald-100 bg / emerald-700 text
Status declined: red-100 bg / red-700 text
```

## Components

### Button — Primary
```
bg-emerald-500 text-white font-semibold rounded-xl px-5 py-2.5
hover:bg-emerald-600 transition-colors
disabled:opacity-50 disabled:cursor-not-allowed
```

### Button — Secondary
```
bg-white text-gray-700 font-medium rounded-xl px-5 py-2.5
border border-gray-200 hover:bg-gray-50 transition-colors
```

### Button — Ghost
```
text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100
```

### Input / Textarea
```
w-full px-4 py-3 bg-white border border-gray-200 rounded-xl
text-gray-900 placeholder-gray-400
focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400
transition-all
```

### Card
```
bg-white border border-gray-100 rounded-2xl p-5 shadow-sm
```

### Tag / Badge
```
Default: bg-gray-100 text-gray-700 border-gray-200
Green:   bg-emerald-50 text-emerald-700 border-emerald-200
Amber:   bg-amber-50  text-amber-700  border-amber-200
Red:     bg-red-50    text-red-700    border-red-200
```
Sizing: `text-xs font-medium px-2.5 py-0.5 rounded-full border`

### Nav
```
bg-white border-b border-gray-100 sticky top-0 z-40
backdrop-blur-none (light theme, no blur needed)
max-w-6xl mx-auto px-6 py-4
```

### Status pill
```
pending:  "Pending"   amber-50/amber-700
accepted: "Accepted"  emerald-50/emerald-700
declined: "Declined"  red-50/red-700
```

## Spacing & Layout

- Max content width: `max-w-4xl` for wide pages, `max-w-3xl` for forms/profiles
- Page padding: `px-4 sm:px-6` horizontal, `py-10 sm:py-12` vertical
- Card gap: `gap-4` or `gap-5`
- Section gap: `space-y-6` or `space-y-8`

## States

### Loading
```tsx
<div className="animate-pulse bg-gray-100 rounded-xl h-20" />
```

### Empty State
```tsx
<div className="text-center py-16 px-6">
  <div className="text-4xl mb-3">{icon}</div>
  <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
  <p className="text-sm text-gray-500 mb-5">{description}</p>
  <Link href={cta.href} className="btn-primary">{cta.label}</Link>
</div>
```

### Error
```tsx
<div className="p-4 rounded-xl bg-red-50 border border-red-200">
  <p className="text-red-700 text-sm">{message}</p>
</div>
```

## Icons
Using inline SVG (heroicons style). No icon library dependency.
Standard sizes: `w-4 h-4` (small), `w-5 h-5` (default), `w-6 h-6` (large)

## Motion / Transitions
- Duration: `duration-150` for interactive, `duration-300` for layout changes
- Easing: default (ease) for most; `ease-out` for reveals
- Keep animations subtle — no heavy transforms in light theme
