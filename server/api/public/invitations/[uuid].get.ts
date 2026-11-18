export default defineEventHandler(async (event) => {
  enforceRateLimit(event, 'invite-read', 90, 60 * 1000)
  const uuid = getRouterParam(event, 'uuid') || ''
  const invitation = await getPublicInvitation(uuid)
  if (!invitation) {
    throw createError({
      statusCode: 404,
      message: 'Não encontramos este convite. Verifique o link recebido no WhatsApp.',
    })
  }
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return invitation
})
