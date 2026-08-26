// 读取原始 markdown 文件（content/<collection>/<slug>.md），并把 YAML frontmatter 剥离，
// 返回 YAML 块之后的正文（纯 markdown 字符串，保留换行与缩进）。
//
// 为什么需要这个：
//   @nuxt/content 的 queryCollection 返回的 body 是 Prose AST（对象数组），
//   无法直接用于"管理后台 textarea 编辑→保存"的闭环（数组 .toString() 变成 [object Object]）。
//   管理后台读、写都走"原始 markdown 文件"链路，才能保证用户看到的和之前写的 100% 一致。
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

export function stripFrontmatter(markdownRaw: string): string {
  if (!markdownRaw) return ''
  const text = markdownRaw.replace(/^\uFEFF/, '')
  // 要求 --- 在第一行单独出现才视为 YAML block 开始
  const startMatch = text.match(/^---[ \t]*\r?\n/)
  if (!startMatch) return text
  const startIdx = startMatch[0].length
  const rest = text.slice(startIdx)
  // 找到下一个独立行 ---（关闭分隔符）
  const endRe = /^---[ \t]*(?:\r?\n|$)/m
  const endMatch = rest.match(endRe)
  if (!endMatch) return text // 没有闭合分隔符 → 直接返回全文
  const after = rest.slice(endMatch.index! + endMatch[0].length)
  // 去掉开头多余的一个空行，让 textarea 光标停在正文首行
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

/** 兼容转换：把 Nuxt Content 返回的 body（可能是 Prose[]、字符串、undefined）
 *  退化为一个可展示的字符串。优先读原始 markdown 文件，失败时用此兜底。 */
export function bodyLikeToString(body: any): string {
  if (body === undefined || body === null) return ''
  if (typeof body === 'string') return body
  if (Array.isArray(body)) {
    // Prose 数组：简单拼 tag.children[].value / text，不做完美还原，避免 [object Object]
    const out: string[] = []
    const walk = (n: any) => {
      if (!n) return
      if (typeof n === 'string') {
        out.push(n)
        return
      }
      if (n.type === 'text' && typeof n.value === 'string') {
        out.push(n.value)
        return
      }
      if (n.type === 'element' || n.tag) {
        // 块级元素后补换行
        const isBlock = /^(h[1-6]|p|li|blockquote|pre|code|hr|ul|ol|table|tr|td|th|div|section)$/.test(
          String(n.tag || n.type).toLowerCase()
        )
        if (Array.isArray(n.children)) n.children.forEach(walk)
        if (isBlock) out.push('\n')
      }
      if (Array.isArray(n.children)) n.children.forEach(walk)
      if (Array.isArray(n.content)) n.content.forEach(walk)
    }
    body.forEach(walk)
    return out.join('').replace(/\n{3,}/g, '\n\n').trim()
  }
  if (typeof body === 'object') {
    try {
      return JSON.stringify(body, null, 2)
    } catch {
      return String(body)
    }
  }
  return String(body)
}
