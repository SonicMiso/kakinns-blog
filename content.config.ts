import { defineCollection, z } from '@nuxt/content'

export const collections = {
  // works：用 Markdown + frontmatter，保证所有字段在构建 SQLite 时都是平面列
  // - 元数据（id/title/slug/date/category/.../materials...）放 frontmatter
  // - 制作过程（process）作为正文，这样还能直接用 <ContentRenderer> 渲染
  works: defineCollection({
    type: 'page',
    source: 'works/**/*.md',
    schema: z.object({
      id: z.number(),
      title: z.string(),
      slug: z.string(),
      date: z.string(),
      category: z.enum(['wood', 'ceramics', 'textile', 'paper', 'metal', 'other']),
      cover: z.string().default(''),
      excerpt: z.string().default(''),
      materials: z.array(z.string()).default([]),
      tools: z.array(z.string()).default([]),
      gallery: z.array(z.string()).default([]),
      featured: z.boolean().default(false),
      status: z.enum(['draft', 'published']).default('published'),
      createdAt: z.string(),
      updatedAt: z.string()
    })
  }),
  journal: defineCollection({
    type: 'page',
    source: 'journal/**/*.md',
    schema: z.object({
      id: z.number(),
      title: z.string(),
      slug: z.string(),
      date: z.string(),
      cover: z.string().default(''),
      excerpt: z.string().default(''),
      status: z.enum(['draft', 'published']).default('published'),
      createdAt: z.string(),
      updatedAt: z.string()
    })
  })
}
