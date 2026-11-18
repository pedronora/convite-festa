export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error, context) => {
    const status = (error as { statusCode?: number }).statusCode
    const path = context.event?.path
    if (status && status < 500) return
    console.error('[server-error]', {
      path,
      status: status || 500,
      message: (error as Error).message,
      stack: process.env.NODE_ENV === 'production' ? undefined : (error as Error).stack,
    })
  })
})
