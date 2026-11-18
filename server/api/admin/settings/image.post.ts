export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.name === 'image' && part.data?.length)
  if (!file) {
    throw createError({
      statusCode: 422,
      message: 'Selecione uma imagem para enviar.',
    })
  }
  const mime = file.type || ''
  const url = await saveInviteImage(Buffer.from(file.data), mime)
  console.info('[settings] image uploaded', { mime, bytes: file.data.length })
  return { url }
})
