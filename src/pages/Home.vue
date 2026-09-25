<script setup lang="ts">
import { mangaService } from '@/services';
import type { MangaDataClass} from '@/types/api';
import { onMounted, ref,  } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const APIUrl = import.meta.env.SUWAYOMI_SERVER_URL

const mangaList = ref<MangaDataClass[]>([]);
const isLoading = ref(true);


const fetchPage = async () => {
   isLoading.value = true
   mangaList.value = await mangaService.getLibrary();
   console.log(await mangaService.getLibrary());

   isLoading.value = false
};

onMounted(async () => {
  await fetchPage()
});

const gotoManga = (id: number) => {
  router.push(`/manga/${id}`);
};
</script>
<template>
<div class="flex gap-4 px-3 py-4 flex-wrap">
    <template v-for="manga in mangaList" :key="manga.id">
        <div class="card bg-base-100 w-[calc(50%-0.5rem)] shadow-sm dark:border dark:border-white/10" @click="gotoManga(manga.id)">
        <div class="badge badge-primary absolute top-2 right-2">{{ manga.source?.name }}</div>
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
