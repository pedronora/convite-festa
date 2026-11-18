<script setup lang="ts">
import { loginSchema, zodFieldErrors } from '#shared/validation'

definePageMeta({ layout: 'auth' })
useHead({
  title: 'Entrar no painel',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

const route = useRoute()
const toast = useToast()
const { login, fetchMe, admin } = useAuth()

await fetchMe()
if (admin.value) {
  await navigateTo('/admin', { replace: true })
}

const form = reactive({ email: '', password: '' })
const showPassword = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const fieldErrors = ref<Record<string, string>>({})

async function submit() {
  errorMessage.value = ''
  fieldErrors.value = {}
  const parsed = loginSchema.safeParse(form)
  if (!parsed.success) {
    fieldErrors.value = zodFieldErrors(parsed.error)
    return
  }
  submitting.value = true
  try {
    await login(parsed.data.email, form.password)
    toast.success('Bem-vindo de volta!')
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/admin')
      ? route.query.redirect
      : '/admin'
    await navigateTo(redirect, { replace: true })
  } catch (error) {
    errorMessage.value = apiErrorMessage(error, 'Não foi possível entrar. Verifique os dados.')
    fieldErrors.value = apiFieldErrors(error)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="rounded-3xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
    <div class="mb-6">
      <span class="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-spider-50 text-spider-600">
        <AppIcon name="lock" :size="21" />
      </span>
      <h1 class="mt-4 font-display text-4xl text-navy-950">Área dos anfitriões</h1>
      <p class="mt-1 text-sm font-semibold text-navy-500">
        Entre para gerenciar convidados, enviar convites e acompanhar as confirmações.
      </p>
    </div>

    <AppAlert v-if="errorMessage" type="error" class="mb-4" title="Não foi possível entrar">
      {{ errorMessage }}
    </AppAlert>

    <form class="space-y-4" novalidate @submit.prevent="submit">
      <FormField label="E-mail" for="login-email" :error="fieldErrors.email" required>
        <input
          id="login-email"
          v-model="form.email"
          type="email"
          class="input-base"
          autocomplete="username"
          inputmode="email"
          maxlength="200"
          placeholder="voce@email.com"
          data-autofocus
        >
      </FormField>

      <FormField label="Senha" for="login-password" :error="fieldErrors.password" required>
        <div class="relative">
          <input
            id="login-password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            class="input-base pr-11"
            autocomplete="current-password"
            maxlength="200"
            placeholder="Sua senha"
          >
          <button
            type="button"
            class="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-navy-400 transition hover:bg-navy-100 hover:text-navy-700"
            :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
            @click="showPassword = !showPassword"
          >
            <AppIcon :name="showPassword ? 'eye-off' : 'eye'" :size="17" />
          </button>
        </div>
      </FormField>

      <AppButton type="submit" size="lg" block :loading="submitting">
        <template #icon><AppIcon name="shield" :size="17" /></template>
        Entrar no painel
      </AppButton>
    </form>

    <div class="mt-5 flex items-start gap-2 rounded-xl bg-navy-50 p-3 text-[11px] font-semibold leading-relaxed text-navy-500">
      <AppIcon name="lock" :size="14" class="mt-0.5 shrink-0" />
      Sessão protegida por cookie seguro e válida por 7 dias. Após várias tentativas incorretas, o acesso é
      bloqueado temporariamente.
    </div>
  </div>
</template>
