<script setup lang="ts">
import { mangaService } from '@/services';
import { OfflineManga } from '@/types/indexeddb';
import { WorkerPool } from '@/workers/pool';
import { inject, onMounted, ref,  } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const APIUrl = import.meta.env.SUWAYOMI_SERVER_URL

const mangaList = ref<OfflineManga[]>([]);
const isLoading = ref(true);

const pool = inject<WorkerPool>('workerPool');


const fetchPage = async () => {
   isLoading.value = true
   mangaList.value = await mangaService.getLibrary();

   isLoading.value = false
};

onMounted(async () => {
  await fetchPage().finally(() => {
    checkUpdate();
  });
});

const gotoManga = (id: number) => {
  router.push(`/manga/${id}`);
};

const checkUpdate = () => {
  if (!pool) return;


  for (const manga of mangaList.value) {
    const timestampInSeconds: number = Math.floor(Date.now() / 1000);

    console.log(manga.id, manga.lastSyncedAt, timestampInSeconds);
    if (!manga.lastSyncedAt || timestampInSeconds - manga.lastSyncedAt > 1) {
      console.log('xx');
      pool.dispatch("checkUpdate", {mangaId: manga.id, pageCount: manga.chapterCount}).then((res) => {
        console.log(res);
        if (res.isUpdateAvailable) {
          mangaService.updateLastSyncedAt(manga.id, timestampInSeconds, true);
        }
      });
    }
  }

};

</script>
<template>
<div class="flex gap-4 px-3 py-4 flex-wrap">
    <template v-for="manga in mangaList" :key="manga.id">
        <div class="card bg-base-100 w-[calc(50%-0.5rem)] shadow-sm dark:border dark:border-white/10" @click="gotoManga(manga.id)">
        <div class="badge badge-secondary absolute top-2 right-2">{{ manga.source?.name }}</div>
        <div class="badge badge-primary absolute top-2 left-2" v-if="manga.hasUpdate">Updated</div>
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

<div v-if="isLoading" class="flex justify-center py-6">
    <span class="loading loading-dots loading-md"></span>
</div>
</template>
