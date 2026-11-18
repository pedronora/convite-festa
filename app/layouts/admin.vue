<script setup lang="ts">
const { admin, logout } = useAuth()
const route = useRoute()
const mobileOpen = ref(false)
const loggingOut = ref(false)

const navigation = [
  { label: 'Dashboard', to: '/admin', icon: 'dashboard', exact: true },
  { label: 'Convidados', to: '/admin/convidados', icon: 'users' },
  { label: 'Envios', to: '/admin/envios', icon: 'send' },
  { label: 'Confirmações', to: '/admin/confirmacoes', icon: 'calendar-check' },
  { label: 'Configurações', to: '/admin/configuracoes', icon: 'settings' },
]

function isActive(item: typeof navigation[number]) {
  if (item.exact) return route.path === item.to
  return route.path === item.to || route.path.startsWith(`${item.to}/`)
}

watch(() => route.fullPath, () => {
  mobileOpen.value = false
})

async function handleLogout() {
  loggingOut.value = true
  await logout()
  loggingOut.value = false
}
</script>

<template>
  <div class="min-h-screen bg-[#f5f7fb]">
    <a
      href="#conteudo-admin"
      class="skip-link"
    >Pular para o conteúdo</a>

    <!-- Sidebar desktop -->
    <aside class="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col overflow-hidden bg-navy-950 text-white lg:flex">
      <div class="pointer-events-none absolute inset-0 text-white opacity-[0.07]">
        <WebDecoration class="absolute -right-24 -top-24 h-80 w-80" />
        <WebDecoration
          class="absolute -bottom-28 -left-20 h-72 w-72"
          :flip-x="true"
          :flip-y="true"
        />
      </div>
      <div class="relative flex h-20 items-center border-b border-white/10 px-6">
        <AppLogo variant="dark" />
      </div>
      <nav
        class="relative flex-1 space-y-1.5 overflow-y-auto px-3 py-6"
        aria-label="Navegação principal"
      >
        <NuxtLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          :class="[
            'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition',
            isActive(item)
              ? 'bg-spider-600 text-white shadow-lg shadow-spider-900/30'
              : 'text-navy-200 hover:bg-white/10 hover:text-white',
          ]"
          :aria-current="isActive(item) ? 'page' : undefined"
        >
          <AppIcon
            :name="item.icon"
            :size="19"
          />
          {{ item.label }}
        </NuxtLink>
      </nav>
      <div class="relative border-t border-white/10 p-4">
        <div class="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <span class="flex h-9 w-9 items-center justify-center rounded-full bg-spider-600 text-sm font-extrabold">
            {{ admin?.name?.charAt(0).toUpperCase() || 'A' }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-bold">
              {{ admin?.name || 'Administrador' }}
            </p>
            <p class="truncate text-[11px] text-navy-400">
              {{ admin?.email }}
            </p>
          </div>
          <button
            type="button"
            class="rounded-lg p-2 text-navy-300 transition hover:bg-white/10 hover:text-white"
            :disabled="loggingOut"
            aria-label="Sair do painel"
            title="Sair"
            @click="handleLogout"
          >
            <AppIcon
              name="logout"
              :size="17"
            />
          </button>
        </div>
      </div>
    </aside>

    <!-- Header mobile -->
    <header class="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-navy-100 bg-white/90 px-4 backdrop-blur lg:hidden">
      <AppLogo
        variant="light"
        compact
      />
      <button
        type="button"
        class="rounded-xl border border-navy-200 p-2 text-navy-700"
        :aria-expanded="mobileOpen"
        aria-controls="menu-admin"
        aria-label="Abrir menu"
        @click="mobileOpen = true"
      >
        <AppIcon
          name="menu"
          :size="22"
        />
      </button>
    </header>

    <!-- Drawer mobile -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition duration-150"
        leave-to-class="opacity-0"
      >
        <div
          v-if="mobileOpen"
          class="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm lg:hidden"
          @click.self="mobileOpen = false"
        >
          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="-translate-x-full"
            leave-active-class="transition duration-150 ease-in"
            leave-to-class="-translate-x-full"
            appear
          >
            <aside
              id="menu-admin"
              class="flex h-full w-[290px] flex-col bg-navy-950 text-white"
              role="dialog"
              aria-modal="true"
              aria-label="Menu do painel"
            >
              <div class="flex h-20 items-center justify-between border-b border-white/10 px-5">
                <AppLogo variant="dark" />
                <button
                  type="button"
                  class="rounded-lg p-2 text-navy-300 hover:bg-white/10 hover:text-white"
                  aria-label="Fechar menu"
                  @click="mobileOpen = false"
                >
                  <AppIcon
                    name="x"
                    :size="20"
                  />
                </button>
              </div>
              <nav
                class="flex-1 space-y-1.5 overflow-y-auto p-3"
                aria-label="Navegação principal"
              >
                <NuxtLink
                  v-for="item in navigation"
                  :key="item.to"
                  :to="item.to"
                  :class="[
                    'flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition',
                    isActive(item) ? 'bg-spider-600 text-white' : 'text-navy-200 hover:bg-white/10 hover:text-white',
                  ]"
                >
                  <AppIcon
                    :name="item.icon"
                    :size="19"
                  />
                  {{ item.label }}
                </NuxtLink>
              </nav>
              <div class="border-t border-white/10 p-4">
                <div class="mb-3 flex items-center gap-3">
                  <span class="flex h-9 w-9 items-center justify-center rounded-full bg-spider-600 text-sm font-extrabold">
                    {{ admin?.name?.charAt(0).toUpperCase() || 'A' }}
                  </span>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-bold">
                      {{ admin?.name }}
                    </p>
                    <p class="truncate text-[11px] text-navy-400">
                      {{ admin?.email }}
                    </p>
                  </div>
                </div>
                <AppButton
                  variant="light"
                  size="sm"
                  block
                  :loading="loggingOut"
                  @click="handleLogout"
                >
                  <template #icon>
                    <AppIcon
                      name="logout"
                      :size="15"
                    />
                  </template>
                  Sair do painel
                </AppButton>
              </div>
            </aside>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <div class="lg:pl-[264px]">
      <main
        id="conteudo-admin"
        class="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
      >
        <slot />
      </main>
    </div>
  </div>
</template>
