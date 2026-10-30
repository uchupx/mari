<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, onMounted, toRaw, inject } from 'vue';
import { mangaService, sourceService } from '@/services';
import { dbService } from '@/db/indexdb';
import { ChapterDataClass, MangaDataClass } from '@/types/api';
import { formatRelativeTime } from '@/utils/datetime';
import { Icon } from '@iconify/vue';
import { useToast } from '@/composables/useToast';
import { useHistoryStore } from '@/stores/historyStore';
import { useDownloadStore } from '@/stores/downloadStore';
import type { WorkerPool } from '@/workers/pool';

const toast = useToast()

const route = useRoute();
const router = useRouter();
const historyStore = useHistoryStore();
const downloadStore = useDownloadStore();
const pool = inject<WorkerPool>('workerPool');
const APIUrl = import.meta.env.SUWAYOMI_SERVER_URL

const mangaId = route.params.id as string;
const manga = ref<MangaDataClass>();
const chapters = ref<ChapterDataClass[]>([]);
const isLoading = ref(true);
const isLoadingChapters = ref(false);
const isOnLibrary = ref(false);

const isDownloading = computed(() => {
  return manga.value ? downloadStore.isDownloadingManga(manga.value.id) : false;
});

const allDownloaded = computed(() => {
  if (!chapters.value.length) return false;
  return chapters.value.every((c) => downloadStore.isChapterDownloaded(c.id));
});

const lastReadChapter = computed(() => {
  return historyStore.continueReading.find((entry) => entry.mangaId === parseInt(mangaId));
});

const handleResumeOrStart = () => {
  if (lastReadChapter.value) {
    router.push({
      name: 'reader',
      params: {
        mangaId: mangaId,
        chapterIndex: lastReadChapter.value.chapterIndex,
      },
    });
    return;
  }

  if (!chapters.value.length) {
    toast.error('Chapters not loaded yet');
    return;
  }

  const firstChapter = [...chapters.value].sort((a, b) => a.chapterNumber - b.chapterNumber)[0];
  if (firstChapter) {
    router.push({
      name: 'reader',
      params: {
        mangaId: mangaId,
        chapterIndex: firstChapter.index,
      },
    });
  }
};

onMounted(async () => {
  if (!historyStore.isInitialized) {
    await historyStore.init();
  }

  downloadStore.refreshDownloadedChapters(parseInt(mangaId));

  getManga().then(() => {
    const timestampInSeconds: number = Math.floor(Date.now() / 1000);
    const shouldOnlineFetch = timestampInSeconds - (manga.value?.lastFetchedAt ?? 0) > 60;

    getChapters(shouldOnlineFetch);
  });

  isOnLibrary.value = await mangaService.isOnLibrary(parseInt(mangaId));
});

const handleDownloadAll = async () => {
  if (!manga.value || !chapters.value.length) {
    toast.error('No chapters available to download');
    return;
  }
  if (!pool) {
    toast.error('Worker pool not ready');
    return;
  }

  toast.info(`Starting download for ${chapters.value.length} chapters...`);
  try {
    await downloadStore.startDownloadAll(manga.value, chapters.value, pool);
    if (downloadStore.error) {
      toast.error(`Download failed: ${downloadStore.error}`);
    } else if (downloadStore.completedChapters > 0 && downloadStore.failedChapters === 0) {
      toast.success(`Successfully downloaded ${downloadStore.completedChapters} chapters!`);
    } else if (downloadStore.completedChapters > 0) {
      toast.warning(
        `Downloaded ${downloadStore.completedChapters} chapters, ${downloadStore.failedChapters} failed.`
      );
    } else if (downloadStore.failedChapters > 0) {
      toast.error(`Failed to download ${downloadStore.failedChapters} chapters.`);
    }
  } catch (err: any) {
    toast.error(`Download failed: ${err?.message || err}`);
  }
};

const handleDownloadChapter = async (chapter: ChapterDataClass) => {
  if (!manga.value) {
    toast.error('Manga not found');
    return;
  }
  if (!pool) {
    toast.error('Worker pool not ready');
    return;
  }
  if (downloadStore.isDownloading) {
    toast.warning('Download All is currently in progress');
    return;
  }

  const isRetry = downloadStore.isChapterDownloaded(chapter.id);
  const actionText = isRetry ? 'Re-downloading' : 'Downloading';
  toast.info(`${actionText} ${chapter.name || `Chapter ${chapter.chapterNumber}`}...`);

  try {
    const success = await downloadStore.downloadSingleChapter(manga.value, chapter, pool);
    if (success) {
      toast.success(`${chapter.name || `Chapter ${chapter.chapterNumber}`} downloaded successfully!`);
    } else {
      toast.error(`Failed to download ${chapter.name || `Chapter ${chapter.chapterNumber}`}`);
    }
  } catch (err: any) {
    toast.error(`Download failed: ${err?.message || err}`);
  }
};

const getChapters = async (shouldOnlineFetch: boolean = false) => {
  isLoadingChapters.value = true;
  const id = parseInt(mangaId);

  try {
    const data = await mangaService.getChapters(id, shouldOnlineFetch);
    chapters.value = data;

    // Simpan/update daftar chapter ke IndexedDB agar tersedia saat offline
    if (isOnLibrary.value || downloadStore.downloadedChapterIds.length > 0) {
      const offlineChapters = data.map((ch) => ({
        ...ch,
        savedAt: Date.now(),
        isOfflineAvailable: downloadStore.isChapterDownloaded(ch.id),
      }));
      await dbService.saveChapters(offlineChapters);
    }
  } catch (err) {
    // Fallback offline: Ambil chapters dari IndexedDB
    const offlineChapters = await dbService.getChaptersForManga(id);
    if (offlineChapters.length > 0) {
      chapters.value = offlineChapters;
    } else {
      console.warn('[Manga] Failed to fetch online and no offline chapters found:', err);
    }
  } finally {
    isLoadingChapters.value = false;
  }
};

const getManga = async () => {
  isLoading.value = true;
  const id = parseInt(mangaId);

  try {
    const data = await mangaService.getManga(id);
    manga.value = data;

    isOnLibrary.value = await mangaService.isOnLibrary(id);

    if (isOnLibrary.value) {
      mangaService.updateHasBeenCheck(id);
    }
  } catch (err) {
    // Fallback offline: Ambil manga dari IndexedDB
    const offlineManga = await dbService.getManga(id);
    if (offlineManga) {
      manga.value = offlineManga;
      isOnLibrary.value = true;
    } else {
      console.warn('[Manga] Failed to fetch online and no offline manga found:', err);
    }
  } finally {
    isLoading.value = false;
  }
};

const addToLibrary = async () => {
  if (!manga.value) {
    toast.error('Manga not found')
    return;
  }
  if (!chapters.value.length) {
    toast.error('Try again after chapters are loaded')
    return;
  }

  const data = toRaw(manga.value)
  const chaptersLength = chapters.value.length;

  try {
    const source = await sourceService.getSource(manga.value.sourceId);
    data.source = source;
  } catch (err) {
    console.warn('[Manga] Could not fetch fresh source info:', err);
  }

  data.chapterCount = chaptersLength;

  await mangaService.addToLibrary(data);

  // Simpan seluruh list chapter ke IndexedDB saat Add to Library
  if (chapters.value.length > 0) {
    const plainChapters = chapters.value.map((c) => ({
      ...toRaw(c),
      savedAt: Date.now(),
      isOfflineAvailable: downloadStore.isChapterDownloaded(c.id),
    }));
    await dbService.saveChapters(plainChapters);
  }

  isOnLibrary.value = true;
  toast.success('Added to Library');
};

const removeFromLibrary = async () => {
  if (!manga.value) return;

  await mangaService.removeFromLibrary(manga.value.id);
  isOnLibrary.value = false;
  toast.info('Removed from Library');
};

</script>
<template>
<div v-if="!isLoading" class="flex flex-col items-center flex-wrap py-2">
    <div class="card bg-base-100 w-full p-4 shadow-sm">
        <figure>
            <img
            :src="manga ? APIUrl + manga!.thumbnailUrl : 'https://via.placeholder.com/300x400'"
            class="aspect-[3/4] w-full object-cover"
            alt="Shoes" />
        </figure>
        <div class="card-body">
            <h1   class="card-title">{{ manga!.title }}</h1>
            <h2 class="text-left">Author: {{ manga!.author }}</h2>
            <div class="badge badge-info">Status: {{ manga!.status }}</div>
            <div class="flex flex-wrap gap-2">
                <template v-for="genre in manga!.genre">
                    <div class="badge badge-outline">{{ genre }}</div>
                </template>
            </div>

            <template v-if="!isOnLibrary">
                <button
                    class="btn bg-pink-500  w-full"
                    @click="addToLibrary"
                >
                    <Icon icon="tabler:hearts" class="size-[1.2em]" />
                    Add To Library
                </button>
            </template>
            <template v-else>
                <button
                    class="btn bg-red-500  w-full"
                    @click="removeFromLibrary"
                >
                    <Icon icon="tabler:hearts-off" class="size-[1.2em]" />
                    Remove From Library
                </button>
            </template>

            <!-- Download Section -->
            <div v-if="isDownloading" class="w-full bg-base-200 p-3 rounded-xl space-y-2 border border-primary/20">
                <div class="flex items-center justify-between text-sm">
                    <span class="font-medium flex items-center gap-2">
                        <span class="loading loading-spinner loading-xs text-primary"></span>
                        Downloading Images...
                    </span>
                    <span class="tabular-nums font-semibold text-primary text-xs">
                        <template v-if="downloadStore.totalImages > 0">
                            {{ downloadStore.downloadedImages }} / {{ downloadStore.totalImages }} img
                        </template>
                        <template v-else>
                            Ch. {{ downloadStore.completedChapters }} / {{ downloadStore.totalChapters }}
                        </template>
                    </span>
                </div>
                <progress
                    class="progress progress-primary w-full"
                    :value="downloadStore.totalImages > 0 ? downloadStore.downloadedImages : downloadStore.completedChapters"
                    :max="downloadStore.totalImages > 0 ? downloadStore.totalImages : (downloadStore.totalChapters || 1)"
                ></progress>
                <div class="flex items-center justify-between text-xs opacity-70">
                    <span class="truncate max-w-[220px]">
                        <template v-if="downloadStore.currentChapterIndex > 0">
                            Ch. {{ downloadStore.currentChapterIndex }}/{{ downloadStore.totalChapters }}:
                        </template>
                        {{ downloadStore.currentChapterName }}
                        <template v-if="downloadStore.currentChapterTotalPages > 0">
                            ({{ downloadStore.currentChapterPageIndex }}/{{ downloadStore.currentChapterTotalPages }}p)
                        </template>
                    </span>
                    <span class="font-semibold">{{ downloadStore.progressPercent }}%</span>
                </div>
                <button
                    class="btn btn-error btn-outline w-full mt-1"
                    @click="downloadStore.cancelDownload(pool)"
                >
                    <Icon icon="material-symbols:cancel-outline" class="size-4" />
                    Cancel Download
                </button>
            </div>
            <button
                v-else
                class="btn btn-primary w-full"
                :disabled="!chapters.length"
                @click="handleDownloadAll"
            >
                <Icon icon="akar-icons:cloud-download" class="size-[1.2em]" />
                {{ allDownloaded ? 'Re-Download All' : 'Download All' }}
            </button>
            <button
                class="btn btn-primary w-full"
                :disabled="!lastReadChapter && !chapters.length"
                @click="handleResumeOrStart"
            >
                <Icon icon="bi:caret-right-fill" class="size-[1.2em]" />
                {{ lastReadChapter ? 'Resume' : 'Start Reading' }}
            </button>

            <p class="text-justify">{{ manga!.description }}</p>
        </div>
    </div>
    <template v-if="isLoadingChapters">
        <div class="flex justify-center py-6">
            <span class="loading loading-dots loading-md"></span>
        </div>
    </template>
    <div class="w-full p-4 mb-10" v-else-if="chapters.length > 0">
        <ul class="list bg-base-100 rounded-box shadow-md">
          <li class="p-4 pb-2 text-xs opacity-60 tracking-wide">Total chapters: {{ chapters.length > 0 ? chapters[0].chapterNumber : 0}}</li>

          <template v-for="chapter in chapters" :key="chapter.id">
            <li
              class="list-row cursor-pointer transition-colors duration-150 hover:bg-base-200 focus:bg-base-200 focus:outline-none active:bg-base-300"
              tabindex="0"
              @click="router.push({ name: 'reader', params: { mangaId: mangaId, chapterIndex: chapter.index } })"
              @keydown.enter="router.push({ name: 'reader', params: { mangaId: mangaId, chapterIndex: chapter.index } })"
            >
              <div class="text-4xl font-thin opacity-30 tabular-nums">{{ chapter.chapterNumber }}</div>
              <div class="min-w-0 flex-1">
                <div class="truncate flex items-center gap-1.5">
                  <span>{{ chapter.name }}</span>
                  <span
                    v-if="downloadStore.isChapterDownloaded(chapter.id)"
                    class="badge badge-xs badge-success gap-0.5 text-[10px]"
                    title="Downloaded"
                  >
                    <Icon icon="material-symbols:check" class="size-3" />
                  </span>
                </div>
                <div class="text-xs uppercase font-semibold opacity-60">{{ formatRelativeTime(chapter.uploadDate) }}</div>
              </div>

              <button
                class="btn btn-square btn-ghost btn-sm dark:text-white text-black"
                :disabled="downloadStore.isDownloading || downloadStore.isChapterDownloading(chapter.id)"
                :title="downloadStore.isChapterDownloading(chapter.id)
                  ? `Downloading: ${downloadStore.getChapterProgress(chapter.id)}%`
                  : downloadStore.isChapterDownloaded(chapter.id)
                    ? 'Retry Download'
                    : 'Download Chapter'"
                :aria-label="downloadStore.isChapterDownloaded(chapter.id) ? 'Retry Download' : 'Download Chapter'"
                @click.stop="handleDownloadChapter(chapter)"
              >
                <!-- Circular Progress (Clockwise) when downloading -->
                <div
                  v-if="downloadStore.isChapterDownloading(chapter.id)"
                  class="relative size-7 flex items-center justify-center"
                >
                  <svg class="size-7 -rotate-90 transform" viewBox="0 0 36 36">
                    <!-- Background circle track -->
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      stroke="currentColor"
                      stroke-width="3"
                      fill="none"
                      class="text-base-content/20"
                    />
                    <!-- Foreground progress circle (clockwise from top) -->
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      stroke="currentColor"
                      stroke-width="3"
                      stroke-linecap="round"
                      fill="none"
                      class="text-black dark:text-white transition-all duration-150"
                      stroke-dasharray="88"
                      :stroke-dashoffset="88 - (88 * (downloadStore.getChapterProgress(chapter.id) || 0)) / 100"
                    />
                  </svg>
                </div>

                <!-- Retry Download Icon when already downloaded -->
                <Icon
                  v-else-if="downloadStore.isChapterDownloaded(chapter.id)"
                  icon="humbleicons:restart"
                  class="size-[1.3em]"
                />

                <!-- Download Chapter Icon when not yet downloaded -->
                <Icon
                  v-else
                  icon="akar-icons:cloud-download"
                  class="size-[1.3em]"
                />
              </button>
            </li>
          </template>
        </ul>
    </div>
    <div v-else class="w-full p-4 mb-40 flex flex-col items-center gap-5">
        <Icon icon="healthicons:not-ok-24px" class="size-[5rem]" />
        <h3>Chapters not found</h3>
    </div>
</div>
<div v-if="isLoading" class="flex justify-center py-6">
  <span class="loading loading-dots loading-md"></span>
</div>
</template>
