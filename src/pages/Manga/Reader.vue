<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { mangaService } from '@/services';
import { Icon } from '@iconify/vue';
import type { ChapterDataClass, MangaDataClass } from '@/types/api';
import { useHistoryStore } from '@/stores/historyStore';
import { WorkerPool } from '@/workers/pool';

interface PageImage {
  url: string;
  isLoaded: boolean;
  error?: string;
}

interface ChapterPage {
  data: ChapterDataClass;
  pages: PageImage[];
  isLoading: boolean;
  error?: string;
}

interface ChapterPages {
  [key: number]: ChapterPage;
}

const route = useRoute();
const historyStore = useHistoryStore();

const chapterPages = ref<ChapterPages>({});
const chapterIndexes = ref<number[]>([]); // ordered chapter indexes from the server
const sentinelEl = ref<HTMLElement | null>(null);
const isLoadingNext = ref(false);
const currentChapterIndex = ref(-1);
const currentPageIndex = ref(-1);

const pool = inject<WorkerPool>('workerPool')!;

const mangaId = parseInt(route.params.mangaId as string);
let currentPage = parseInt(route.params.chapterIndex as string);

let observer: IntersectionObserver | null = null;
let manga: MangaDataClass | undefined = undefined;

const nextChapterIndex = (): number | null => {
  return currentPage + 1;
};

onMounted(() => {
  getChapter(mangaId, currentPage);


  mangaService.getManga(mangaId).then((m) => {
    manga = m;
  });

  mangaService.getChapter(mangaId, currentPage).then((chapter) => {
    const pageUrls = Array.from({ length: chapter.pageCount }, (_, k) =>
      mangaService.getPageImageUrl(mangaId, currentPage, k, false)
    );
    pool.dispatch('chapterDownload', { mangaId, chapterId: currentPage, pageUrls })
  });

  loadChapterList();


  observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      const next = nextChapterIndex();
      if (next !== null && !isLoadingNext.value) {
        if (chapterPages.value[next]) return;

        getChapter(mangaId, next);
      }
    },
    { rootMargin: '400px 0px' }
  );
  if (sentinelEl.value) observer.observe(sentinelEl.value);

  window.addEventListener('scroll', onScroll, { passive: true });
});

onBeforeUnmount(() => {
  if (observer) observer.disconnect();
  window.removeEventListener('scroll', onScroll);
})

const loadChapterList = async () => {
  try {
    const chapters = await mangaService.getChapters(mangaId);
    chapterIndexes.value = chapters.map((c) => c.index);
  } catch {
    // list is only used to resolve the next chapter; ignore failures
  }
};

const getChapter = async (mangaId: number, chapterIndex: number) => {
  if (chapterPages.value[chapterIndex]) return; // already loaded or loading

  const chapter: ChapterPage = {
    data: null as any,
    pages: [],
    isLoading: true,
  };
  chapterPages.value[chapterIndex] = chapter;
  currentPage = chapterIndex;
  isLoadingNext.value = true;

  try {
    const data = await mangaService.getChapter(mangaId, chapterIndex);
    chapterPages.value[chapterIndex].data = data;

    chapterPages.value[chapterIndex].pages = Array.from({ length: data.pageCount }, (_, k) => ({
      url: mangaService.getPageImageUrl(mangaId, chapterIndex, k, false),
      isLoaded: false,
      error: undefined,
    }));
  } catch (err: any) {
    if (err?.status && err.status === 404) {
      chapterPages.value[chapterIndex].error = 'Chapter not found';
      return;
    }

    chapterPages.value[chapterIndex].error = err?.message ?? 'Failed to load chapter';
  } finally {
    chapterPages.value[chapterIndex].isLoading = false;
    isLoadingNext.value = false;
  }
};

const onImgLoad = (chapter: ChapterPage, i: number) => {
  chapter.pages[i].isLoaded = true;
};

const onImgError = (chapter: ChapterPage, i: number) => {
  chapter.pages[i].error = 'Failed to load';
};

const retryImage = (chapter: ChapterPage, i: number) => {
  const img = chapter.pages[i];
  img.error = undefined;
  img.url = mangaService.getPageImageUrl(mangaId, Number(chapter.data.index), i + 1, false) + `&_r=${Date.now()}`;
};

const onScroll = async () => {
    const midViewport = window.innerHeight / 2;

    let page: number | undefined;
    let chapter: number | undefined;

    for (const el of document.querySelectorAll<HTMLElement>(`img`)) {
      if (el.getBoundingClientRect().top <= midViewport) {
        page = Number(el.getAttribute('data-page-index'));
        chapter = Number(el.getAttribute('data-chapter-index'));
      }
    }

    if (page !== undefined && chapter !== undefined) {
      if (page !== currentPageIndex.value || chapter !== currentChapterIndex.value) {
        currentPageIndex.value = page;
        currentChapterIndex.value = chapter;

        const chapterData = chapterPages.value[chapter].data;
        historyStore.recordProgress(manga!, chapterData, page)
      }
    }
};
</script>
<template>
  <!-- <div class="min-h-screen bg-base-300 pb-10">
    <div class="navbar sticky top-0 z-40 bg-base-100 shadow-md">
      <button class="btn btn-ghost btn-circle" aria-label="Back" @click="router.back()">
        <Icon icon="tabler:arrow-left" class="size-[1.4em]" />
      </button>
      <div class="min-w-0 flex-1 px-2">
        <div class="truncate text-sm font-semibold">{{ chapter?.name ?? 'Loading…' }}</div>
        <progress class="progress progress-primary h-1 w-full" :value="settledCount" :max="total || 1"></progress>
      </div>
      <span class="whitespace-nowrap text-xs tabular-nums opacity-70">{{ settledCount }}/{{ total }}</span>
    </div> -->

    <template v-for="(chapter, chapterIndex) in chapterPages" :key="'chapter-idx-' + chapterIndex">
        <div v-if="chapter.isLoading" class="flex justify-center py-6">
            <span class="loading loading-dots loading-md"></span>
        </div>
        <div v-else-if="chapter.error" class="flex justify-center py-6">
            <span class="text-error">{{ chapter.error }}</span>
        </div>

        <template v-else>
            <div class="mx-auto max-w-3xl">
                <div class="divider text-sm font-semibold mx-3">
                    {{ chapter.data.name }}
                </div>
                <figure v-for="(img, i) in chapter.pages" :key="i" class="relative min-h-40 bg-base-100">
                    <img
                    v-if="!img.error"
                    :src="img.url"
                    :alt="`Page ${i + 1}`"
                    loading="lazy"
                    class="block w-full"
                    @load="onImgLoad(chapter, i)"
                    @error="onImgError(chapter, i)"
                    :data-chapter-index="chapterIndex"
                    :data-page-index="i"
                    />
                    <div v-else class="flex aspect-[3/4] flex-col items-center justify-center" @click="retryImage(chapter, i)">
                        <Icon icon="humbleicons:restart" class="size-[3rem] mb-3 text-error" />
                        <span class="text-error text-sm">Reload image</span>
                    </div>
                    <!-- <figcaption class="badge badge-neutral absolute right-2 top-2 tabular-nums">{{ i + 1 }} / {{ total }}</figcaption> -->
                </figure>
                <div class="divider text-sm font-semibold mx-3 py-5">
                    {{ chapter.data.name }} END
                </div>
            </div>
        </template>
    </template>

    <!-- bottom sentinel: always rendered so the observer can attach on mount -->
    <div ref="sentinelEl" class="h-1"></div>
</template>
