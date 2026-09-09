import { defineCollection, z } from '@nuxt/content'

export const collections = {
  // ⚠️ 根原则：
  // 1) id 是 Nuxt Content 内部保留字段（SQLite 主键），不要在 frontmatter 中手写，
  //    否则会被内部覆盖成类似 "works/works/works/walnut-box-01.md" 的怪路径。
  // 2) 业务标识用 slug，且必须在 schema 中显式声明为 z.string() —— 显式类型声明
  //    = SQLite 建 TEXT 列，不会走到 INT 分支 → 不会出现 NaN 列 / UNIQUE 冲突，
  //    无需 patch 任何三方包。
  // 3) createdAt / updatedAt 用 z.string()（存储 ISO8601 字符串，如 2026-03-15T10:30:00Z）：
  //    新建时后台同时写两者，修改时只写 updatedAt（z.string 而非 z.coerce.date() → TEXT 列）。
  works: defineCollection({
    type: 'page',
    source: 'works/**/*.md',
    schema: z.object({
      slug: z.string(),        // TEXT 列：= 文件名（不含扩展名）
      title: z.string(),
      date: z.string(),        // 发布日期（业务语义，可能≠createdAt）
      createdAt: z.string(),   // 创建时间 ISO8601（后台新建时写入）
      updatedAt: z.string(),   // 更新时间 ISO8601（新建/修改时均写入）
      category: z.enum(['wood', 'ceramics', 'textile', 'paper', 'metal', 'other']),
      cover: z.string().default(''),
      excerpt: z.string().default(''),
      materials: z.array(z.string()).default([]),
      tools: z.array(z.string()).default([]),
      gallery: z.array(z.string()).default([]),
      featured: z.boolean().default(false),
      status: z.enum(['draft', 'published']).default('published')
    })
  }),
  journal: defineCollection({
    type: 'page',
    source: 'journal/**/*.md',
    schema: z.object({
      slug: z.string(),        // TEXT 列：= 文件名（不含扩展名）
      title: z.string(),
      date: z.string(),        // 发布日期
      createdAt: z.string(),   // 创建时间 ISO8601
      updatedAt: z.string(),   // 更新时间 ISO8601
      cover: z.string().default(''),
      excerpt: z.string().default(''),
      status: z.enum(['draft', 'published']).default('published')
    })
  })
}
