// 客户端可用的 Markdown 工具（无 node:fs/node:path 依赖，避免被打包到客户端）。
// 提供 minimark → Markdown 源码的反向还原，给前台详情页在"字符串退化"场景下使用。
//
// 注意：此文件必须与 server/utils/rawContent.ts 里的 minimarkToMarkdown 实现保持一致；
// 复制一份而不是 re-export server 版本，是因为 server 文件 import 了 fs/path，
// 被 Nuxt 打进客户端 chunk 会直接报错。

type MiniNode = any[] | string

function isInlineSoft(t: string): boolean {
  return /^(strong|em|b|i|code|a|img|br|span|del|u|sup|sub|mark)$/.test(t)
}

function renderInlines(nodes: MiniNode[]): string {
  const out: string[] = []
  for (const n of nodes) {
    if (typeof n === 'string') { out.push(n); continue }
    if (!Array.isArray(n)) continue
    const tag = String(n[0] || '').toLowerCase()
    const attrs = (n[1] && typeof n[1] === 'object' && !Array.isArray(n[1])) ? (n[1] as Record<string, any>) : {}
    const children = (attrs ? n.slice(2) : n.slice(1)) as MiniNode[]
    const inner = renderInlines(children.length ? children : [])
    switch (tag) {
      case 'strong': case 'b': out.push(`**${inner}**`); break
      case 'em': case 'i': out.push(`*${inner}*`); break
      case 'del': case 's': out.push(`~~${inner}~~`); break
      case 'code': out.push(`\`${inner}\``); break
      case 'br': out.push('  \n'); break
      case 'img': {
        const src = attrs.src || ''; const alt = attrs.alt || ''
        const title = attrs.title ? ` "${attrs.title}"` : ''
        out.push(`![${alt}](${src}${title})`); break
      }
      case 'a': {
        const href = attrs.href || ''
        const title = attrs.title ? ` "${attrs.title}"` : ''
        out.push(`[${inner}](${href}${title})`); break
      }
      default: out.push(inner)
    }
  }
  return out.join('')
}

interface RenderCtx { out: string[]; indent: string }

function renderList(ctx: RenderCtx, node: any[], ordered: boolean, startAttr: number) {
  const attrs = (node[1] && typeof node[1] === 'object' && !Array.isArray(node[1])) ? node[1] : {}
  const children = (attrs ? node.slice(2) : node.slice(1)) as any[]
  let idx = typeof attrs.start === 'number' ? attrs.start : (typeof startAttr === 'number' ? startAttr : 1)
  for (const child of children) {
    if (!Array.isArray(child)) continue
    const ctag = String(child[0] || '').toLowerCase()
    if (ctag !== 'li') continue
    const cattrs = (child[1] && typeof child[1] === 'object' && !Array.isArray(child[1])) ? child[1] : {}
    const cch = (cattrs ? child.slice(2) : child.slice(1)) as MiniNode[]
    const marker = ordered ? `${idx}. ` : '- '
    idx++
    const lines: string[] = []
    let inlineBuf: MiniNode[] = []
    const flushInline = () => {
      if (inlineBuf.length) { lines.push(renderInlines(inlineBuf)); inlineBuf = [] }
    }
    for (const c of cch) {
      if (Array.isArray(c)) {
        const t = String(c[0] || '').toLowerCase()
        if (isInlineSoft(t)) inlineBuf.push(c)
        else {
          flushInline()
          const subCtx: RenderCtx = { out: [], indent: ctx.indent + '  ' }
          renderBlock(subCtx, c)
          lines.push(...subCtx.out)
        }
      } else {
        inlineBuf.push(c)
      }
    }
    flushInline()
    if (lines.length === 0) { ctx.out.push(`${ctx.indent}${marker}`); continue }
    const first = lines.shift()!
    ctx.out.push(`${ctx.indent}${marker}${first}`)
    const pad = ctx.indent + ' '.repeat(marker.length)
    for (const l of lines) ctx.out.push(`${pad}${l}`)
  }
}

function renderBlock(ctx: RenderCtx, node: any[]) {
  if (!Array.isArray(node) || !node.length) return
  const tag = String(node[0] || '').toLowerCase()
  const attrs = (node[1] && typeof node[1] === 'object' && !Array.isArray(node[1])) ? (node[1] as Record<string, any>) : {}
  const children = (attrs ? node.slice(2) : node.slice(1)) as MiniNode[]

  switch (tag) {
    case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': {
      const lv = parseInt(tag.slice(1), 10)
      ctx.out.push(`${ctx.indent}${'#'.repeat(lv)} ${renderInlines(children).trim()}`)
      ctx.out.push(''); return
    }
    case 'p': {
      const txt = renderInlines(children).trimEnd()
      if (txt) ctx.out.push(`${ctx.indent}${txt}`)
      ctx.out.push(''); return
    }
    case 'hr':
      ctx.out.push(`${ctx.indent}---`)
      ctx.out.push(''); return
    case 'blockquote': {
      const subCtx: RenderCtx = { out: [], indent: '' }
      for (const c of children) if (Array.isArray(c)) renderBlock(subCtx, c)
      for (const line of subCtx.out) {
        ctx.out.push(line === '' ? `${ctx.indent}>` : `${ctx.indent}> ${line}`)
      }
      if (subCtx.out.length && ctx.out[ctx.out.length - 1] !== '') ctx.out.push('')
      return
    }
    case 'pre': {
      let codeText = ''; let lang = ''
      for (const c of children) {
        if (Array.isArray(c) && String(c[0] || '').toLowerCase() === 'code') {
          const cattrs = (c[1] && typeof c[1] === 'object' && !Array.isArray(c[1])) ? c[1] as any : {}
          lang = cattrs.lang || cattrs.className?.replace?.('language-', '') || ''
          const cch = (cattrs ? c.slice(2) : c.slice(1)) as MiniNode[]
          codeText = renderInlines(cch)
          break
        }
      }
      if (!codeText) codeText = renderInlines(children)
      const tick = '```'
      ctx.out.push(`${ctx.indent}${tick}${lang}`)
      for (const l of codeText.replace(/\r/g, '').split('\n')) ctx.out.push(`${ctx.indent}${l}`)
      ctx.out.push(`${ctx.indent}${tick}`)
      ctx.out.push(''); return
    }
    case 'code': {
      const cattrs = attrs as any
      const lang = cattrs.lang || cattrs.className?.replace?.('language-', '') || ''
      const codeText = renderInlines(children)
      const tick = '```'
      ctx.out.push(`${ctx.indent}${tick}${lang}`)
      for (const l of codeText.replace(/\r/g, '').split('\n')) ctx.out.push(`${ctx.indent}${l}`)
      ctx.out.push(`${ctx.indent}${tick}`)
      ctx.out.push(''); return
    }
    case 'ul': case 'ol':
      renderList(ctx, node, tag === 'ol', 1)
      ctx.out.push(''); return
    case 'li':
      renderList(ctx, ['ul', {}, node], false, 1); return
    case 'table': {
      const rows: MiniNode[][] = []
      for (const c of children) {
        if (!Array.isArray(c)) continue
        const t = String(c[0] || '').toLowerCase()
        if (t === 'thead' || t === 'tbody') {
          const inner = (c[1] && typeof c[1] === 'object' && !Array.isArray(c[1])) ? c.slice(2) : c.slice(1)
          for (const r of inner) if (Array.isArray(r) && String(r[0]).toLowerCase() === 'tr') rows.push(r)
        } else if (t === 'tr') rows.push(c)
      }
      const matrix: string[][] = rows.map((r) => {
        const inner = (r[1] && typeof r[1] === 'object' && !Array.isArray(r[1])) ? r.slice(2) : r.slice(1)
        return inner.map((cell) => {
          if (Array.isArray(cell)) return renderInlines((cell[1] && typeof cell[1] === 'object' && !Array.isArray(cell[1])) ? cell.slice(2) : cell.slice(1)).trim()
          return ''
        })
      })
      if (!matrix.length) return
      const colCount = Math.max(...matrix.map(r => r.length))
      const pad = (s: string, n: number) => s + ' '.repeat(Math.max(0, n - Array.from(s).length))
      const colWidths: number[] = new Array(colCount).fill(3)
      for (const r of matrix) for (let i = 0; i < colCount; i++) colWidths[i] = Math.max(colWidths[i], Array.from(r[i] ?? '').length)
      const fmt = (r: string[]) => `| ${r.map((v, i) => pad(v ?? '', colWidths[i])).join(' | ')} |`
      ctx.out.push(`${ctx.indent}${fmt(matrix[0])}`)
      ctx.out.push(`${ctx.indent}| ${colWidths.map(w => '-'.repeat(w)).join(' | ')} |`)
      for (let i = 1; i < matrix.length; i++) ctx.out.push(`${ctx.indent}${fmt(matrix[i])}`)
      ctx.out.push(''); return
    }
    default: {
      const text = renderInlines(children).trim()
      if (text) { ctx.out.push(`${ctx.indent}${text}`); ctx.out.push('') }
      for (const c of children) if (Array.isArray(c)) renderBlock(ctx, c)
    }
  }
}

export function minimarkToMarkdown(input: unknown): string {
  if (input === undefined || input === null) return ''
  if (typeof input === 'string') return input
  if (typeof input === 'object' && !Array.isArray(input)) {
    const o = input as any
    if (o.type === 'minimark' && Array.isArray(o.value)) {
      const ctx: RenderCtx = { out: [], indent: '' }
      for (const node of o.value) if (Array.isArray(node)) renderBlock(ctx, node)
      return ctx.out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
    }
  }
  if (Array.isArray(input)) {
    const isRawMinimark = input.length > 0 && Array.isArray(input[0]) && typeof input[0][0] === 'string'
    if (isRawMinimark) {
      const ctx: RenderCtx = { out: [], indent: '' }
      for (const node of input) if (Array.isArray(node)) renderBlock(ctx, node)
      return ctx.out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
    }
  }
  const o = input as any
  if (typeof o?.markdown === 'string') return o.markdown
  if (typeof o?.raw === 'string') return o.raw
  try { return JSON.stringify(input, null, 2) } catch { return String(input) }
}
