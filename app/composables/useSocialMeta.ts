import { resolveAppBaseUrl, resolveSocialImageUrl, socialImageType } from '#shared/utils/social'

export interface SocialMetaInput {
  title: string
  description: string
  imagePath: string
}

/**
 * Centraliza as tags de prévia (Open Graph/Twitter) usadas nas páginas
 * públicas. A URL base ignora `APP_URL` inválido ou de exemplo e cai para a
 * origem da requisição.
 */
export function useSocialMeta() {
  const config = useRuntimeConfig()
  const requestUrl = useRequestURL()
  const route = useRoute()

  const baseUrl = resolveAppBaseUrl(String(config.public.appUrl || ''), requestUrl.origin)
  const pageUrl = computed(() => `${baseUrl}${route.path}`)

  function buildMeta({ title, description, imagePath }: SocialMetaInput) {
    const image = resolveSocialImageUrl(baseUrl, imagePath)
    const type = socialImageType(imagePath)

    return [
      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: 'pt_BR' },
      { property: 'og:url', content: pageUrl.value },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:image:alt', content: 'Arte do convite da festa' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
      ...(type ? [{ property: 'og:image:type', content: type }] : []),
      ...(image.startsWith('https://') ? [{ property: 'og:image:secure_url', content: image }] : []),
    ]
  }

  return { baseUrl, pageUrl, buildMeta }
}
