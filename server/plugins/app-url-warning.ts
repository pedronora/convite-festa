import { isPublicAppUrl } from '#shared/utils/social'

export default defineNitroPlugin(() => {
  if (process.env.NODE_ENV !== 'production') return

  const appUrl = String(useRuntimeConfig().public.appUrl || '')
  if (isPublicAppUrl(appUrl)) return

  console.warn(
    '[convite-festa] NUXT_PUBLIC_APP_URL ausente, interno ou com valor de exemplo. '
    + 'Links e prévias vão usar a origem da requisição; defina a URL pública no .env de produção.',
  )
})
