import { listManagedImages } from '../../utils/imageHosting'

export default defineEventHandler(async () => {
  const items = await listManagedImages()
  return { items }
})
