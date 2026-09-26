<script setup lang="ts">
import { onMounted, ref, computed, watch, provide, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useOfflineStore } from '@/stores/offlineStore';
import { Icon } from '@iconify/vue';
import { useToast } from '@/composables/useToast';
import { useHistoryStore } from './stores/historyStore';
import { WorkerPool } from './workers/pool';

const toast = useToast();
const toastList = toast.toasts; // top-level ref → auto-unwrapped in template
const offlineStore = useOfflineStore();

const route = useRoute();
const router = useRouter();

const historyStore = useHistoryStore();
const hideChrome = computed(() => route.meta.hideNavbar === true);

const pool = new WorkerPool(
  new URL('./workers/taskRegister.ts', import.meta.url),
  3
);

historyStore.init();
provide('workerPool', pool)

const isDark = ref(false);
const isAppReady = ref(false);

const applyTheme = () => {
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light');
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
};

const toggleTheme = () => {
  isDark.value = !isDark.value;
  applyTheme();
};

onMounted(async () => {
  const saved = localStorage.getItem('theme');
  isDark.value = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme();

  await offlineStore.init();
  toast.success('Offline storage initialized');

  isAppReady.value = true;
});

watch(router.currentRoute, (route) => {
  document.title = route.meta.title as string;
});

onUnmounted(() => {
  pool.terminate();
});

</script>
<template>

<!-- Splash Screen -->
<Transition name="splash">
  <div
    v-if="!isAppReady"
    class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-base-100"
  >
    <img
      src="/icons/favicon-192x192.png"
      alt="Mari"
      class="size-24 rounded-2xl shadow-lg mb-6"
    />
    <span class="text-xl font-bold tracking-wide mb-8">Mari</span>
    <span class="loading loading-dots loading-md text-primary"></span>
  </div>
</Transition>

<!-- Main App -->
<template v-if="isAppReady">
  <div v-if="!hideChrome" class="navbar bg-base-100 shadow-sm h-[4rem]">
    <a class="btn btn-ghost text-xl">{{route.meta.title}}</a>
    <button class="btn btn-ghost btn-circle ml-auto" @click="toggleTheme" :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
      <!-- sun: shown in dark mode -->
      <svg v-if="isDark" class="size-[1.4em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path></svg>
      <!-- moon: shown in light mode -->
      <svg v-else class="size-[1.4em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
    </button>
  </div>

  <div class="w-full bg-base-200 ">
    <div class="container mx-auto pb-10">
      <div class="w-full bg-base-200" :class="hideChrome ? 'h-screen' : 'h-[calc(100vh-4rem)]'">
          <router-view />
      </div>
    </div>
  </div>


  <!-- Toast host -->
  <div class="toast toast-top toast-center z-[60]">
    <div
      v-for="t in toastList"
      :key="t.id"
      role="status"
      class="alert"
      :class="{
        'alert-info': t.type === 'info',
        'alert-success': t.type === 'success',
        'alert-warning': t.type === 'warning',
        'alert-error': t.type === 'error',
      }"
    >
      <span v-if="t.type === 'loading'" class="loading loading-spinner loading-sm"></span>
      <span>{{ t.message }}</span>
    </div>
  </div>

  <!-- Mobile-only bottom dock (hidden ≥ md) -->
  <div v-if="!hideChrome" class="dock dock-xs md:hidden pb-5 h-20">
    <RouterLink to="/" active-class="dock-active">
      <Icon icon="gravity-ui:house-fill" class="size-[1.2em]" />
      <span class="dock-label">Home</span>
    </RouterLink>
    <RouterLink to="/sources" active-class="dock-active">
      <Icon icon="tabler:books" class="size-[1.2em]" />
      <span class="dock-label">Sources</span>
    </RouterLink>
    <RouterLink to="/history" active-class="dock-active">
      <Icon icon="tabler:history" class="size-[1.2em]" />
      <span class="dock-label">History</span>
    </RouterLink>
    <RouterLink to="/settings" active-class="dock-active">
      <Icon icon="tabler:settings-cog" class="size-[1.2em]" />
      <span class="dock-label">Settings</span>
    </RouterLink>
  </div>
</template>

</template>

<style scoped>
.splash-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.splash-leave-to {
  opacity: 0;
  transform: scale(1.05);
}
</style>
