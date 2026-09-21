<script setup lang="ts">
import { computed } from 'vue';
import type { MangaDataClass } from '@/types/api';
import { useOfflineStore } from '@/stores/offlineStore';
import { useHistoryStore } from '@/stores/historyStore';

const props = defineProps<{
  manga: MangaDataClass;
}>();

const offlineStore = useOfflineStore();
const historyStore = useHistoryStore();

const isSaved = computed(() => offlineStore.isMangaSaved(props.manga.id));

const toggleSaveOffline = async () => {
  if (isSaved.value) {
    await offlineStore.removeMangaOffline(props.manga.id);
  } else {
    // Generate mock chapters if not present for demonstration
    const sampleChapters = props.manga.chapters || [
      {
        id: props.manga.id * 1000 + 1,
        url: `${props.manga.url}/chapter-1`,
        name: 'Chapter 1: The Beginning',
        uploadDate: Date.now() - 86400000 * 30,
        chapterNumber: 1,
        mangaId: props.manga.id,
        read: false,
        bookmarked: false,
        lastPageRead: 0,
        lastReadAt: 0,
        index: 1,
        fetchedAt: Date.now(),
        downloaded: true,
        pageCount: 24,
        lastModifiedAt: Date.now(),
        version: 1,
      },
      {
        id: props.manga.id * 1000 + 2,
        url: `${props.manga.url}/chapter-2`,
        name: 'Chapter 2: The Journey',
        uploadDate: Date.now() - 86400000 * 20,
        chapterNumber: 2,
        mangaId: props.manga.id,
        read: false,
        bookmarked: false,
        lastPageRead: 0,
        lastReadAt: 0,
        index: 2,
        fetchedAt: Date.now(),
        downloaded: true,
        pageCount: 22,
        lastModifiedAt: Date.now(),
        version: 1,
      },
    ];
    await offlineStore.saveMangaOffline(props.manga, sampleChapters);
  }
};

const simulateRead = async () => {
  const dummyChapter = {
    id: props.manga.id * 1000 + 1,
    name: 'Chapter 1: The Beginning',
    chapterNumber: 1,
    index: 1,
    pageCount: 24,
  };
  const randomPage = Math.floor(Math.random() * 20) + 1;
  await historyStore.recordProgress(props.manga, dummyChapter, randomPage);
};
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700 flex flex-col overflow-hidden">
    <!-- Thumbnail with status overlay -->
    <div class="relative aspect-[3/4] bg-gray-100 dark:bg-gray-700 overflow-hidden group">
      <img
        :src="manga.thumbnailUrl"
        :alt="manga.title"
        class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
        @error="($event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&auto=format&fit=crop&q=80'"
      />
      <!-- Status Badge -->
      <span
        class="absolute top-2.5 left-2.5 text-xs font-semibold px-2 py-0.5 rounded shadow-sm"
        :class="manga.status === 'COMPLETED'
          ? 'bg-green-100 text-green-800 dark:bg-green-900/80 dark:text-green-300'
          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-300'"
      >
        {{ manga.status }}
      </span>

      <!-- Offline Stored Badge -->
      <span
        v-if="isSaved"
        class="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded shadow flex items-center space-x-1"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>IDB</span>
      </span>

      <!-- Unread Count -->
      <div v-if="manga.unreadCount > 0" class="absolute bottom-2.5 right-2.5 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
        {{ manga.unreadCount }} unread
      </div>
    </div>

    <!-- Content info -->
    <div class="p-4 flex-1 flex flex-col justify-between">
      <div>
        <h3 class="text-base font-bold text-gray-900 dark:text-white line-clamp-1 mb-1" :title="manga.title">
          {{ manga.title }}
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">
          {{ manga.author || manga.artist || 'Unknown Author' }} • {{ manga.chapterCount }} Ch.
        </p>

        <!-- Genres badges -->
        <div class="flex flex-wrap gap-1 mb-3">
          <span
            v-for="genre in manga.genre.slice(0, 3)"
            :key="genre"
            class="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-[11px] font-medium px-2 py-0.5 rounded"
          >
            {{ genre }}
          </span>
          <span
            v-if="manga.genre.length > 3"
            class="text-[11px] text-gray-400 dark:text-gray-500 self-center"
          >
            +{{ manga.genre.length - 3 }}
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
        <!-- Save/Remove IndexedDB Button -->
        <button
          type="button"
          @click="toggleSaveOffline"
          class="flex-1 text-xs font-medium py-2 px-3 rounded-lg focus:outline-none focus:ring-2 transition-colors flex items-center justify-center space-x-1"
          :class="isSaved
            ? 'text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
            : 'text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700'"
        >
          <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="isSaved" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>{{ isSaved ? 'Remove IDB' : 'Save IDB' }}</span>
        </button>

        <!-- Read Progress Button -->
        <button
          type="button"
          @click="simulateRead"
          title="Simulate reading progress into IndexedDB"
          class="p-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
