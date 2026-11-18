export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/admin/login') return
  const { admin, fetchMe } = useAuth()
  const me = admin.value ?? await fetchMe()
  if (!me) {
    return navigateTo({ path: '/admin/login', query: { redirect: to.fullPath } })
  }
})
