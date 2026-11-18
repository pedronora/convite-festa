export interface AdminUser {
  id: number
  name: string
  email: string
}

export function useAuth() {
  const admin = useState<AdminUser | null>('auth-admin', () => null)

  async function fetchMe(): Promise<AdminUser | null> {
    try {
      const requestFetch = useRequestFetch as unknown as () => (
        url: string,
        options?: Record<string, unknown>,
      ) => Promise<{ admin: AdminUser | null }>
      let data: { admin: AdminUser | null }
      if (import.meta.server) {
        data = await requestFetch()('/api/auth/me')
      }
      else {
        data = await $fetch<{ admin: AdminUser | null }>('/api/auth/me')
      }
      admin.value = data.admin
      return data.admin
    }
    catch {
      admin.value = null
      return null
    }
  }

  async function login(email: string, password: string): Promise<AdminUser> {
    const data = await $fetch<{ admin: AdminUser }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    admin.value = data.admin
    return data.admin
  }

  async function logout(): Promise<void> {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    }
    finally {
      admin.value = null
      await navigateTo('/admin/login')
    }
  }

  return { admin, isAuthenticated: computed(() => Boolean(admin.value)), fetchMe, login, logout }
}
