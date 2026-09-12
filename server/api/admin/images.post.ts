import { uploadImageToGitHub, getAllowedImageExtension, MAX_IMAGE_SIZE } from '../../../utils/imageHosting'

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.name === 'file')

  if (!file?.data) {
    throw createError({ statusCode: 400, statusMessage: '请选择要上传的图片。' })
  }

  const contentType = String(file.type || '')
  if (!getAllowedImageExtension(contentType)) {
    throw createError({ statusCode: 400, statusMessage: '仅支持 JPG、PNG、WebP、GIF 图片。' })
  }
  if (file.data.length > MAX_IMAGE_SIZE) {
    throw createError({ statusCode: 413, statusMessage: '图片不能超过 10 MB。' })
  }

  const result = await uploadImageToGitHub(Buffer.from(file.data), contentType)

  return {
    ...result,
    uploadedAt: new Date().toISOString()
  }
})
