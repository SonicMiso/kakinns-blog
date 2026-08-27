// 读取原始 markdown 文件（content/<collection>/<slug>.md），并把 YAML frontmatter 剥离，
// 返回 YAML 块之后的正文（纯 markdown 字符串，保留换行与缩进）。
//
// 为什么需要这个：
//   @nuxt/content 的 queryCollection 返回的 body 是 minimark AST（对象），
//   无法直接用于"管理后台 textarea 编辑→保存"的闭环（对象 .toString() / JSON.stringify 会变成一堆 JSON）。
//   管理后台读、写都走"原始 markdown 文件"链路，才能保证用户看到的和之前写的 100% 一致。
//   如果原始文件读不到（生产 Docker 镜像运行期不包含 content 源码、或路径不匹配），
//   退而求其次：用 minimark 对象反向还原出等价的 Markdown 源码。
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

export function stripFrontmatter(markdownRaw: string): string {
  if (!markdownRaw) return ''
  const text = markdownRaw.replace(/^\uFEFF/, '')
  const startMatch = text.match(/^---[ \t]*\r?\n/)
  if (!startMatch) return text
  const startIdx = startMatch[0].length
  const rest = text.slice(startIdx)
  const endRe = /^---[ \t]*(?:\r?\n|$)/m
  const endMatch = rest.match(endRe)
  if (!endMatch) return text
  const after = rest.slice(endMatch.index! + endMatch[0].length)
  return after.replace(/^\r?\n/, '')
}

export function readRawContentBody(
  collection: 'works' | 'journal',
  slug: string,
  opts?: { projectRoot?: string }
): string {
  if (!slug) return ''
  const root = opts?.projectRoot || resolve(process.cwd())
  const filePath = resolve(root, 'content', collection, `${slug}.md`)
  if (!existsSync(filePath)) return ''
  try {
    const raw = readFileSync(filePath, 'utf-8')
    return stripFrontmatter(raw)
  } catch {
    return ''
  }
}

// ===================== minimark AST → Markdown 源码还原 =====================
//
// Nuxt Content v3 (minimark) 单节点结构:
//   ["tag", {attrs}, children... 或 inlineString 片段]
// 行内节点（在 p/li/hN 内部）可能是字符串 或 ["tag", {attrs}, children/text]
//
// 支持的块: h1..h6, p, ul, ol, li, blockquote, hr, pre, code, table / thead / tbody / tr / th / td
// 支持的行内: strong / em / code / a / img / br

type MiniNode = any[] | string

function isInlineSoft(t: string): boolean {
  return /^(strong|em|b|i|code|a|img|br|span|del|u|sup|sub|mark)$/.test(t)
}

function renderInlines(nodes: MiniNode[]): string {
  const out: string[] = []
  for (const n of nodes) {
    if (typeof n === 'string') {
      out.push(n)
      continue
    }
    if (!Array.isArray(n)) continue
    const tag = String(n[0] || '').toLowerCase()
    const attrs = (n[1] && typeof n[1] === 'object' && !Array.isArray(n[1])) ? (n[1] as Record<string, any>) : {}
    const children = (attrs ? n.slice(2) : n.slice(1)) as MiniNode[]
    const inner = renderInlines(children.length ? children : [])
    switch (tag) {
      case 'strong':
      case 'b':
        out.push(`**${inner}**`); break
      case 'em':
      case 'i':
        out.push(`*${inner}*`); break
      case 'del':
      case 's':
        out.push(`~~${inner}~~`); break
      case 'code':
        out.push(`\`${inner}\``); break
      case 'br':
        out.push('  \n'); break
      case 'img': {
        const src = attrs.src || ''
        const alt = attrs.alt || ''
        const title = attrs.title ? ` "${attrs.title}"` : ''
        out.push(`![${alt}](${src}${title})`)
        break
      }
      case 'a': {
        const href = attrs.href || ''
        const title = attrs.title ? ` "${attrs.title}"` : ''
        out.push(`[${inner}](${href}${title})`)
        break
      }
      default:
        // 未知行内标签：直接吐内部文本保内容
        out.push(inner)
    }
  }
  return out.join('')
}

interface RenderCtx {
  out: string[]
  indent: string
}

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
    // 先把该 li 下的块内容分出来
    const lines: string[] = []
    let inlineBuf: MiniNode[] = []
    const flushInline = () => {
      if (inlineBuf.length) {
        lines.push(renderInlines(inlineBuf))
        inlineBuf = []
      }
    }
    for (const c of cch) {
      if (Array.isArray(c)) {
        const t = String(c[0] || '').toLowerCase()
        if (isInlineSoft(t)) {
          inlineBuf.push(c)
        } else {
          flushInline()
          // 嵌套块：再递归 renderBlock 但带缩进（挂在同一个 li 下）
          const subCtx: RenderCtx = { out: [], indent: ctx.indent + '  ' }
          renderBlock(subCtx, c)
          lines.push(...subCtx.out)
        }
      } else {
        inlineBuf.push(c)
      }
    }
    flushInline()
    // 输出第一行 + marker，然后后续行补缩进
    if (lines.length === 0) {
      ctx.out.push(`${ctx.indent}${marker}`)
      continue
    }
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
      ctx.out.push('')
      return
    }
    case 'p': {
      const txt = renderInlines(children).trimEnd()
      if (txt) ctx.out.push(`${ctx.indent}${txt}`)
      ctx.out.push('')
      return
    }
    case 'hr':
      ctx.out.push(`${ctx.indent}---`)
      ctx.out.push('')
      return
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
      // 通常 pre 里有 code；优先找 code 节点取 content
      let codeText = ''
      let lang = ''
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
      for (const l of codeText.replace(/\r/g, '').split('\n')) {
        ctx.out.push(`${ctx.indent}${l}`)
      }
      ctx.out.push(`${ctx.indent}${tick}`)
      ctx.out.push('')
      return
    }
    case 'code': {
      // code 出现在块级（少见）
      const cattrs = attrs as any
      const lang = cattrs.lang || cattrs.className?.replace?.('language-', '') || ''
      const codeText = renderInlines(children)
      const tick = '```'
      ctx.out.push(`${ctx.indent}${tick}${lang}`)
      for (const l of codeText.replace(/\r/g, '').split('\n')) {
        ctx.out.push(`${ctx.indent}${l}`)
      }
      ctx.out.push(`${ctx.indent}${tick}`)
      ctx.out.push('')
      return
    }
    case 'ul':
    case 'ol': {
      renderList(ctx, node, tag === 'ol', 1)
      ctx.out.push('')
      return
    }
    case 'li': {
      // 单独出现的 li，包成列表再渲染
      renderList(ctx, ['ul', {}, node], false, 1)
      return
    }
    case 'table': {
      // 找到 thead / tbody / tr
      const rows: MiniNode[][] = []
      for (const c of children) {
        if (!Array.isArray(c)) continue
        const t = String(c[0] || '').toLowerCase()
        if (t === 'thead' || t === 'tbody') {
          const inner = (c[1] && typeof c[1] === 'object' && !Array.isArray(c[1])) ? c.slice(2) : c.slice(1)
          for (const r of inner) if (Array.isArray(r) && String(r[0]).toLowerCase() === 'tr') rows.push(r)
        } else if (t === 'tr') {
          rows.push(c)
        }
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
      ctx.out.push('')
      return
    }
    default: {
      // 未知容器标签：把 children 当纯文本收一下，不让内容丢失
      const text = renderInlines(children).trim()
      if (text) {
        ctx.out.push(`${ctx.indent}${text}`)
        ctx.out.push('')
      }
      // 尝试再走一遍 children 的块级递归（防止容器是 section / div / article）
      for (const c of children) if (Array.isArray(c)) renderBlock(ctx, c)
    }
  }
}

/** 把 Nuxt Content v3 返回的 minimark 结构（{type:'minimark', value:[...]}）
 *  或 Prose 数组、或字符串 统一还原成 Markdown 源码字符串。
 *
 *  生产环境（Docker 运行期无 .md 源码）下的主还原逻辑。 */
export function minimarkToMarkdown(input: unknown): string {
  if (input === undefined || input === null) return ''
  if (typeof input === 'string') return input

  // 情况 1: Nuxt Content v3 minimark 包装对象
  if (typeof input === 'object' && !Array.isArray(input)) {
    const o = input as any
    if (o.type === 'minimark' && Array.isArray(o.value)) {
      const ctx: RenderCtx = { out: [], indent: '' }
      for (const node of o.value) if (Array.isArray(node)) renderBlock(ctx, node)
      return ctx.out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
    }
  }

  // 情况 2: 裸的 Prose[] 数组 (旧 Nuxt Content Prose 格式 / minimark value 部分)
  if (Array.isArray(input)) {
    // 判断是裸 Prose[] 还是 minimark value（第一项是 ["h2",{...},text]）
    const isRawMinimark = input.length > 0 && Array.isArray(input[0]) && typeof input[0][0] === 'string'
    if (isRawMinimark) {
      const ctx: RenderCtx = { out: [], indent: '' }
      for (const node of input) if (Array.isArray(node)) renderBlock(ctx, node)
      return ctx.out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
    }
    // 其他情况 fallback：保留原来的 Prose 拼接
    return proseArrayToString(input as any[])
  }

  // 情况 3: 兜底（可能是带 .markdown/.raw 字段的对象）
  const o = input as any
  if (typeof o.markdown === 'string') return o.markdown
  if (typeof o.raw === 'string') return o.raw
  try { return JSON.stringify(input, null, 2) } catch { return String(input) }
}

function proseArrayToString(body: any[]): string {
  const out: string[] = []
  const walk = (n: any) => {
    if (!n) return
    if (typeof n === 'string') { out.push(n); return }
    if (n.type === 'text' && typeof n.value === 'string') { out.push(n.value); return }
    const tag = String(n.tag || n.type || '').toLowerCase()
    const isBlock = /^(h[1-6]|p|li|blockquote|pre|code|hr|ul|ol|table|tr|td|th|div|section)$/.test(tag)
    if (Array.isArray(n.children)) n.children.forEach(walk)
    if (Array.isArray(n.content)) n.content.forEach(walk)
    if (isBlock) out.push('\n')
  }
  body.forEach(walk)
  return out.join('').replace(/\n{3,}/g, '\n\n').trim()
}

/** 兼容转换：把 Nuxt Content 返回的 body（可能是 minimark / Prose[] / 字符串）
 *  退化为 Markdown 源码字符串。优先读原始 markdown 文件，失败时用此兜底。 */
export function bodyLikeToString(body: any): string {
  if (body === undefined || body === null) return ''
  if (typeof body === 'string') return body
  return minimarkToMarkdown(body)
}
