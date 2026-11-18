export default defineEventHandler(async (event) => {
  const admin = await getAdminSession(event)
  return { admin }
})
