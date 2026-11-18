import { createHash, randomBytes } from 'node:crypto'
import { and, eq, gt } from 'drizzle-orm'
import type { H3Event } from 'h3'

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7

function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function cookieOptions(event: H3Event) {
  const secure = getRequestURL(event).protocol === 'https:'
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    maxAge: SESSION_MAX_AGE_MS / 1000,
  }
}

export async function createAdminSession(event: H3Event, adminUserId: number): Promise<void> {
  const config = useRuntimeConfig()
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS)
  const db = useDb()
  await db.insert(schema.adminSessions).values({
    adminUserId,
    tokenHash: tokenHash(token),
    expiresAt,
  })
  setCookie(event, config.sessionCookieName as string, token, cookieOptions(event))
}

export async function destroyAdminSession(event: H3Event): Promise<void> {
  const config = useRuntimeConfig()
  const token = getCookie(event, config.sessionCookieName as string)
  if (token) {
    const db = useDb()
    await db.delete(schema.adminSessions).where(eq(schema.adminSessions.tokenHash, tokenHash(token)))
  }
  deleteCookie(event, config.sessionCookieName as string, { path: '/' })
}

export interface AdminIdentity {
  id: number
  name: string
  email: string
}

export async function getAdminSession(event: H3Event): Promise<AdminIdentity | null> {
  if (event.context.admin) return event.context.admin as AdminIdentity
  const config = useRuntimeConfig()
  const token = getCookie(event, config.sessionCookieName as string)
  if (!token) return null
  const db = useDb()
  const [row] = await db
    .select({
      id: schema.adminUsers.id,
      name: schema.adminUsers.name,
      email: schema.adminUsers.email,
    })
    .from(schema.adminSessions)
    .innerJoin(schema.adminUsers, eq(schema.adminSessions.adminUserId, schema.adminUsers.id))
    .where(
      and(
        eq(schema.adminSessions.tokenHash, tokenHash(token)),
        gt(schema.adminSessions.expiresAt, new Date()),
      ),
    )
    .limit(1)
  if (!row) return null
  event.context.admin = row
  return row
}

export async function requireAdmin(event: H3Event): Promise<AdminIdentity> {
  const method = event.method.toUpperCase()
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const origin = getRequestHeader(event, 'origin')
    if (origin) {
      let originHost = ''
      try {
        originHost = new URL(origin).host
      } catch {
        originHost = ''
      }
      if (originHost !== getRequestURL(event).host) {
        throw createError({ statusCode: 403, message: 'Origem não permitida' })
      }
    }
  }
  const admin = await getAdminSession(event)
  if (!admin) {
    throw createError({
      statusCode: 401,
      message: 'Sua sessão expirou. Entre novamente.',
    })
  }
  return admin
}
