<script setup lang="ts">
import { useToast } from '@/composables/useToast';
import { sourceService } from '@/services';
import type { MangaDataClass, MangaSearchResult } from '@/types/api';
import { Icon } from '@iconify/vue';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const toast = useToast();

const APIUrl = import.meta.env.SUWAYOMI_SERVER_URL
const sourceId = route.params.id as string;
const tab = ref<'popular' | 'latest' | 'filter'>('popular');
const open = ref(false);

const mangaList = ref<MangaDataClass[]>([]);
const pageNum = ref(1);
const hasNextPage = ref(false);
const isLoading = ref(false);
const sentinelEl = ref<HTMLElement | null>(null);

let observer: IntersectionObserver | null = null;

const fetchPage = (t: 'popular' | 'latest' | 'filter', page: number): Promise<MangaSearchResult> | null => {
  if (t === 'popular') return sourceService.getPopular(sourceId, page);
  if (t === 'latest') return sourceService.getLatest(sourceId, page);

  return null; // filter not implemented yet
};

const loadTab = async (t: 'popular' | 'latest' | 'filter') => {
  isLoading.value = true;
  mangaList.value = [];

  try {
    const data = await fetchPage(t, 1);
    console.log(data);
    mangaList.value = data?.mangaList ?? [];
    hasNextPage.value = data?.hasNextPage ?? false;
    pageNum.value = 1;
  } finally {
    isLoading.value = false;
  }
};

const loadMore = async () => {
  if (isLoading.value || !hasNextPage.value) return;
  const loading = toast.loading('')

  isLoading.value = true;
  try {
    const data = await fetchPage(tab.value, pageNum.value + 1);

    if (data) {
      mangaList.value.push(...data.mangaList);
      hasNextPage.value = data.hasNextPage;
      pageNum.value += 1;
    }
  } finally {
    isLoading.value = false;

    loading.close()
  }
};

onMounted(async () => {
  await loadTab(tab.value);

  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) loadMore();
    },
    { rootMargin: '400px 0px' }
  );
  if (sentinelEl.value) observer.observe(sentinelEl.value);
});

watch(tab, async (newTab) => {
  await loadTab(newTab);
});

onBeforeUnmount(() => observer?.disconnect());

const gotoManga = (id: number) => {
  router.push(`/manga/${id}`);
};
</script>
<template>
  <div class="flex gap-4 px-3 py-4 flex-wrap">
      <template v-for="manga in mangaList" :key="manga.id">
        <div class="card bg-base-100 w-[calc(50%-0.5rem)] shadow-sm dark:border dark:border-white/10" @click="gotoManga(manga.id)">
          <figure>
            <img
              :src="APIUrl + manga.thumbnailUrl"
              loading="lazy"
              class="aspect-[3/4] w-full object-cover"
              :alt="manga.title" />
          </figure>
          <div class="card-body h-14 px-3 py-2 justify-center">
            <h2 class="card-title block w-full truncate text-sm" :title="manga.title">{{ manga.title }}</h2>
          </div>
        </div>
        </template>
      </div>

  <div ref="sentinelEl" class="h-1"></div>
  <div v-if="isLoading" class="flex justify-center py-6">
    <span class="loading loading-dots loading-md"></span>
  </div>

  <div class="fixed bottom-30 right-2">
    <div tabindex="0" role="button" class="btn bg-purple-600 capitalize rounded-full px-5 flex" @click="open = !open">
        <Icon icon="codex:menu" class="size-[2rem]" />
        {{ tab }}
    </div>
    <ul v-show="open" class="absolute right-0 bottom-full menu bg-transparent z-50 p-2 mb-2 shadow-sm rounded-box w-fit min-w-28  items-end">
          <li class="btn btn-sm my-1 w-fit p-5 rounded-full bg-primary capitalize text-white flex flex-row items-center gap-2" @click="tab = 'popular'; open = false">
              <Icon icon="bxs:star" class="size-[1rem] p-0 text-white" color="white"/>
              Popular
          </li>
          <li class="btn btn-sm my-1 w-fit p-5 rounded-full bg-secondary capitalize text-white flex flex-row items-center gap-2" @click="tab = 'latest'; open = false">
              <Icon icon="carbon:update-now" class="size-[1rem] p-0 text-white" color="white"/>
              Latest
          </li>
          <li class="btn btn-sm my-1 w-fit p-5 rounded-full bg-warning capitalize text-white flex flex-row items-center gap-2" @click="tab = 'filter'; open = false">
              <Icon icon="basil:filter-solid" class="size-[1rem] p-0 text-white" color="white"/>
              Filter
          </li>
    </ul>
    <div v-show="open" class="fixed inset-0 z-40" @click="open = false"></div>
  </div>
</template>
