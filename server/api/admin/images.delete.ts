import { deleteManagedImage } from '../../utils/imageHosting'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ path?: string }>(event)
  const path = String(body?.path || '')
  const result = await deleteManagedImage(path)
  return {
    ...result,
    deletedAt: new Date().toISOString()
  }
})
