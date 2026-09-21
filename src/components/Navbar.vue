<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useOfflineStore } from '@/stores/offlineStore';
import { useMangaStore } from '@/stores/mangaStore';

const emit = defineEmits<{
  (e: 'open-offline'): void;
  (e: 'search', term: string): void;
}>();

const offlineStore = useOfflineStore();
const mangaStore = useMangaStore();

const searchQuery = ref('');
const isDark = ref(false);
const isMobileMenuOpen = ref(false);

const toggleDarkMode = () => {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
};

const handleSearch = () => {
  emit('search', searchQuery.value);
};

onMounted(() => {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    isDark.value = true;
    document.documentElement.classList.add('dark');
  }
});
</script>

<template>
  <nav class="bg-white border-b border-gray-200 px-4 py-2.5 dark:bg-gray-800 dark:border-gray-700 sticky top-0 z-40">
    <div class="flex flex-wrap justify-between items-center max-w-7xl mx-auto">
      <!-- Brand -->
      <a href="#" class="flex items-center space-x-3">
        <div class="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center text-white font-black shadow-md shadow-primary-500/30">
          M
        </div>
        <span class="self-center text-xl font-bold whitespace-nowrap dark:text-white tracking-tight">
          Manga<span class="text-primary-600 dark:text-primary-400">Flow</span>
        </span>
      </a>

      <!-- Search Bar -->
      <div class="flex items-center md:order-2 space-x-3">
        <form @submit.prevent="handleSearch" class="hidden sm:block">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 dark:text-gray-400">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Search manga..."
              class="block w-48 lg:w-64 p-2 pl-9 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
            />
          </div>
        </form>

        <!-- Offline Library Button -->
        <button
          type="button"
          @click="$emit('open-offline')"
          class="relative inline-flex items-center p-2 text-sm font-medium text-center text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
          title="IndexedDB Offline Library"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7c0-2-1.5-3-3.5-3h-9C5.5 4 4 5 4 7zm0 4h16M9 4v16"></path>
          </svg>
          <span class="sr-only">Offline Store</span>
          <span
            v-if="offlineStore.savedCount > 0"
            class="absolute inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary-600 rounded-full -top-1.5 -right-1.5 border-2 border-white dark:border-gray-800"
          >
            {{ offlineStore.savedCount }}
          </span>
        </button>

        <!-- Dark Mode Toggle -->
        <button
          type="button"
          @click="toggleDarkMode"
          class="p-2 text-gray-500 rounded-lg hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700"
          title="Toggle Theme"
        >
          <svg v-if="isDark" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fill-rule="evenodd" clip-rule="evenodd"></path>
          </svg>
          <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
          </svg>
        </button>

        <!-- Server Status Badge -->
        <span
          class="hidden lg:inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border"
          :class="mangaStore.serverConnected
            ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
            : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'"
        >
          <span
            class="w-2 h-2 mr-1.5 rounded-full"
            :class="mangaStore.serverConnected ? 'bg-green-500' : 'bg-amber-500 animate-pulse'"
          ></span>
          {{ mangaStore.serverConnected ? 'Suwayomi Online' : 'Local / Offline Mode' }}
        </span>

        <!-- Mobile menu button -->
        <button
          type="button"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
          class="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
        >
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>

      <!-- Nav Links -->
      <div
        :class="isMobileMenuOpen ? 'block' : 'hidden'"
        class="items-center justify-between w-full md:flex md:w-auto md:order-1"
      >
        <ul class="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 md:flex-row md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-800 dark:border-gray-700">
          <li>
            <a href="#" class="block py-2 px-3 text-primary-700 rounded md:bg-transparent md:text-primary-700 md:p-0 dark:text-primary-400" aria-current="page">Catalog</a>
          </li>
          <li>
            <a href="#" @click.prevent="$emit('open-offline')" class="block py-2 px-3 text-gray-700 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-primary-700 md:p-0 dark:text-gray-300 dark:hover:bg-gray-700 md:dark:hover:text-primary-400">
              IndexedDB Storage ({{ offlineStore.savedCount }})
            </a>
          </li>
          <li>
            <a href="#diagnostics" class="block py-2 px-3 text-gray-700 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-primary-700 md:p-0 dark:text-gray-300 dark:hover:bg-gray-700 md:dark:hover:text-primary-400">API Contract</a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>
