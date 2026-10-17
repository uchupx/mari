<script setup lang="ts">
import { onMounted } from 'vue';
import { useHistoryStore } from '@/stores/historyStore';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import ListCard from '@/components/ListCard.vue';
import type { ReadingHistoryEntry } from '@/types/indexeddb';

const router = useRouter();
const API_URL = import.meta.env.SUWAYOMI_SERVER_URL;
const historyStore = useHistoryStore();
const { history } = storeToRefs(historyStore);

const resumeReading = (item: ReadingHistoryEntry) => {
  router.push({
    name: 'reader',
    params: {
      mangaId: item.mangaId,
      chapterIndex: item.chapterIndex,
    },
  });
};

const goToManga = (item: ReadingHistoryEntry) => {
  router.push({
    name: 'manga-detail',
    params: { id: item.mangaId },
  });
};

const deleteEntry = async (id: string) => {
  await historyStore.removeEntry(id);
};

onMounted(async () => {
  if (!historyStore.isInitialized) {
    await historyStore.init();
  }
});
</script>

<template>
  <div class="w-full p-4 mb-10">
    <ul class="list bg-base-100 rounded-box shadow-md overflow-hidden">
      <ListCard
        v-for="item in history"
        :key="item.id"
        :action-width="80"
        @click="goToManga(item)"
        @action="deleteEntry(item.id)"
      >
        <template #action>
          <div class="w-full h-full bg-error text-error-content flex flex-col items-center justify-center gap-1 cursor-pointer">
            <Icon icon="tabler:trash" class="size-5" />
            <span class="text-xs font-semibold">Delete</span>
          </div>
        </template>

        <div class="list-row w-full">
          <div>
            <img
              class="size-10 rounded-box object-cover aspect-[3/4]"
              :src="API_URL + item.mangaThumbnailUrl"
              alt="Thumbnail"
            />
          </div>
          <div class="min-w-0">
            <div class="truncate font-medium">{{ item.mangaTitle }}</div>
            <div class="text-xs uppercase font-semibold opacity-60 truncate">{{ item.chapterName }}</div>
          </div>

          <button
            type="button"
            class="btn bg-purple-500 hover:bg-purple-600 text-white rounded-full btn-sm shrink-0"
            @click.stop="resumeReading(item)"
          >
            Resume
            <Icon icon="bi:caret-right-fill" class="text-white size-4" />
          </button>
        </div>
      </ListCard>
    </ul>
  </div>
</template>
