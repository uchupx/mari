<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, toRaw } from 'vue';
import { mangaService, sourceService } from '@/services';
import { ChapterDataClass, MangaDataClass } from '@/types/api';
import { formatRelativeTime } from '@/utils/datetime';
import { Icon } from '@iconify/vue';
import { useToast } from '@/composables/useToast';

const toast = useToast()

const route = useRoute();
const router = useRouter();
const APIUrl = import.meta.env.SUWAYOMI_SERVER_URL

const mangaId = route.params.id as string;
const manga = ref<MangaDataClass>();
const chapters = ref<ChapterDataClass[]>([]);
const isLoading = ref(true);
const isLoadingChapters = ref(false);
const isOnLibrary = ref(false);

onMounted(async () => {
  getManga();
  getChapters();

  isOnLibrary.value = await mangaService.isOnLibrary(parseInt(mangaId));
});

const getChapters = () => {
  isLoading.value = true;
  const id = parseInt(mangaId);

  mangaService.getChapters(id)
    .then((data) => {
      chapters.value = data;
    })
    .finally(() => {
      isLoading.value = false;
    });
};

const getManga = () => {
  isLoading.value = true;
  const id = parseInt(mangaId);

  mangaService.getManga(id)
    .then((data) => {
      manga.value = data;
    })
    .finally(() => {
      isLoading.value = false;
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

            <button
                class="btn btn-primary w-full"
            >
                <Icon icon="akar-icons:cloud-download" class="size-[1.2em]" />
                Download
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
              <div class="min-w-0">
                <div class="truncate">{{ chapter.name }}</div>
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
