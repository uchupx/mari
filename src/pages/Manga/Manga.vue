<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, onMounted, toRaw, inject } from 'vue';
import { mangaService, sourceService } from '@/services';
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

const getChapters = (shouldOnlineFetch: boolean = false) => {
  isLoading.value = true;
  const id = parseInt(mangaId);

  mangaService.getChapters(id, shouldOnlineFetch)
    .then((data) => {
      chapters.value = data;
    })
    .finally(() => {
      isLoading.value = false;
    });
};

const getManga = async () => {
  isLoading.value = true;
  const id = parseInt(mangaId);

  return mangaService.getManga(id)
    .then(async (data) => {
      manga.value = data;

      isOnLibrary.value = await mangaService.isOnLibrary(id);

      if (isOnLibrary.value) {
        mangaService.updateHasBeenCheck(id);
      }
    })
    .finally(() => {
      isLoading.value = false;
      return;
    });
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

  const source = await sourceService.getSource(manga.value.sourceId)

  data.source = source;
  data.chapterCount = chaptersLength;

  await mangaService.addToLibrary(data);
  isOnLibrary.value = true;

};

const removeFromLibrary = async () => {
  if (!manga.value) return;

  await mangaService.removeFromLibrary(manga.value.id);
  isOnLibrary.value = false;
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
                    class="btn btn-error btn-outline btn-xs w-full mt-1"
                    @click="downloadStore.cancelDownload"
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
                class="btn btn-square btn-ghost btn-sm"
                @click.stop
              >
                <svg aria-label="Bookmark" class="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g stroke-linejoin="round" stroke-linecap="round" stroke-width="2" fill="none" stroke="currentColor"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></g></svg>
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
