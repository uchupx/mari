<script setup lang="ts">
import { ref } from 'vue';
import { useOfflineStore } from '@/stores/offlineStore';
import { useHistoryStore } from '@/stores/historyStore';

defineProps<{
  isOpen: boolean;
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const offlineStore = useOfflineStore();
const historyStore = useHistoryStore();
const activeTab = ref<'mangas' | 'history' | 'bookmarks'>('mangas');

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const handleClearAll = async () => {
  if (confirm('Are you sure you want to clear all offline IndexedDB data?')) {
    await offlineStore.clearAll();
    await historyStore.clearAll();
  }
};
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
    @click.self="$emit('close')"
  >
    <div class="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-xl dark:bg-gray-800 flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center space-x-2">
          <div class="p-2 bg-primary-100 rounded-lg dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7c0-2-1.5-3-3.5-3h-9C5.5 4 4 5 4 7zm0 4h16M9 4v16"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">
              IndexedDB Offline Storage
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Browser-persisted manga, chapters, and history using Pinia + idb
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="$emit('close')"
          class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>

      <!-- Flowbite Tabs -->
      <div class="border-b border-gray-200 dark:border-gray-700 px-4 bg-gray-50 dark:bg-gray-850">
        <ul class="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400">
          <li class="mr-2">
            <button
              @click="activeTab = 'mangas'"
              class="inline-flex items-center p-4 border-b-2 rounded-t-lg space-x-2"
              :class="activeTab === 'mangas'
                ? 'text-primary-600 border-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'"
            >
              <span>Saved Mangas</span>
              <span class="bg-primary-100 text-primary-800 text-xs font-semibold px-2 py-0.5 rounded-full dark:bg-primary-900/40 dark:text-primary-300">
                {{ offlineStore.savedCount }}
              </span>
            </button>
          </li>
          <li class="mr-2">
            <button
              @click="activeTab = 'history'"
              class="inline-flex items-center p-4 border-b-2 rounded-t-lg space-x-2"
              :class="activeTab === 'history'
                ? 'text-primary-600 border-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'"
            >
              <span>Reading History</span>
              <span class="bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-0.5 rounded-full dark:bg-gray-700 dark:text-gray-300">
                {{ historyStore.history.length }}
              </span>
            </button>
          </li>
          <li>
            <button
              @click="activeTab = 'bookmarks'"
              class="inline-flex items-center p-4 border-b-2 rounded-t-lg space-x-2"
              :class="activeTab === 'bookmarks'
                ? 'text-primary-600 border-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'"
            >
              <span>Bookmarks</span>
              <span class="bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-0.5 rounded-full dark:bg-gray-700 dark:text-gray-300">
                {{ offlineStore.bookmarks.length }}
              </span>
            </button>
          </li>
        </ul>
      </div>

      <!-- Tab Content Area -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- 1. Saved Mangas Tab -->
        <div v-if="activeTab === 'mangas'">
          <div v-if="offlineStore.offlineMangas.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400">
            <svg class="mx-auto w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
            <p class="text-sm">No manga stored in IndexedDB yet.</p>
            <p class="text-xs text-gray-400 mt-1">Click "Save IDB" on any card in the catalog to store it offline.</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="manga in offlineStore.offlineMangas"
              :key="manga.id"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-xl dark:bg-gray-750 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700"
            >
              <div class="flex items-center space-x-3 min-w-0">
                <img
                  :src="manga.thumbnailUrl"
                  :alt="manga.title"
                  class="w-12 h-16 object-cover rounded-md flex-shrink-0 bg-gray-200"
                  @error="($event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=200&auto=format&fit=crop&q=80'"
                />
                <div class="min-w-0">
                  <h4 class="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {{ manga.title }}
                  </h4>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Saved on {{ formatDate(manga.savedAt) }}
                  </p>
                  <div class="flex items-center gap-1.5 mt-1">
                    <span class="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 font-semibold px-2 py-0.5 rounded">
                      {{ manga.status }}
                    </span>
                    <span class="text-[10px] text-gray-500 dark:text-gray-400">
                      {{ manga.chapterCount }} chapters
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                @click="offlineStore.removeMangaOffline(manga.id)"
                class="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
                title="Remove from IndexedDB"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 2. Reading History Tab -->
        <div v-if="activeTab === 'history'">
          <div v-if="historyStore.history.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400">
            <p class="text-sm">No reading history recorded yet.</p>
            <p class="text-xs text-gray-400 mt-1">Simulate reading on any manga card to store page progress.</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="item in historyStore.history"
              :key="item.id"
              class="p-3 bg-gray-50 rounded-xl dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 space-y-2"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
                    {{ item.mangaTitle }}
                  </h4>
                  <p class="text-xs text-primary-600 dark:text-primary-400 font-medium">
                    {{ item.chapterName }} • Page {{ item.lastPageRead }} of {{ item.pageCount }}
                  </p>
                </div>
                <span class="text-xs text-gray-400">
                  {{ formatDate(item.readAt) }}
                </span>
              </div>

              <!-- Progress bar -->
              <div class="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div
                  class="bg-primary-600 h-2 rounded-full transition-all"
                  :style="{ width: `${item.progressPercentage}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Bookmarks Tab -->
        <div v-if="activeTab === 'bookmarks'">
          <div v-if="offlineStore.bookmarks.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400">
            <p class="text-sm">No bookmarked chapters yet.</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="b in offlineStore.bookmarks"
              :key="b.chapterId"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-xl dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700"
            >
              <div>
                <h4 class="text-sm font-semibold text-gray-900 dark:text-white">{{ b.mangaTitle }}</h4>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ b.chapterName }}</p>
              </div>
              <button
                type="button"
                @click="offlineStore.toggleBookmark({ id: b.mangaId, title: b.mangaTitle }, { id: b.chapterId, name: b.chapterName, chapterNumber: b.chapterNumber })"
                class="text-red-500 hover:text-red-700 text-xs font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <button
          type="button"
          @click="handleClearAll"
          class="text-xs font-semibold text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center space-x-1"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
          <span>Clear All IDB Storage</span>
        </button>

        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700"
        >
          Done
        </button>
      </div>
    </div>
  </div>
</template>
