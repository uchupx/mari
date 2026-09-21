<script setup lang="ts">
import { onMounted } from 'vue';
import { useHistoryStore } from '@/stores/historyStore';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';

const router = useRouter();
const API_URL = import.meta.env.SUWAYOMI_SERVER_URL;
const historyStore = useHistoryStore();
const { history } = storeToRefs(historyStore);

onMounted(async () => {
  console.log(history.value)
});
</script>

<template>
  <div class="w-full p-4 mb-10">
      <ul class="list bg-base-100 rounded-box shadow-md">
        <template v-for="item in history" :key="item.id">
          <li
            class="list-row cursor-pointer transition-colors duration-150 hover:bg-base-200 focus:bg-base-200 focus:outline-none active:bg-base-300"
            tabindex="0"
            @click="router.push({ name: 'manga-detail', params: { id: item.mangaId } })"
            @keydown.enter="router.push({ name: 'manga-detail', params: { id: item.mangaId } })"
          >
            <div>
                <img class="size-10 rounded-box object-cover aspect-[3/4]"
                :src="API_URL + item.mangaThumbnailUrl"
                alt="Tailwind CSS list item" />
            </div>
            <div class="min-w-0">
              <div class="truncate">{{ item.mangaTitle }}</div>
              <div class="text-xs uppercase font-semibold opacity-60">{{ item.chapterName }}</div>
            </div>

            <button
              class="btn bg-purple-500 rounded-full btn-sm"
              @click.stop
            >
                Resume
                <Icon icon="bi:caret-right-fill" class="text-white size-4"/>
            </button>
          </li>
        </template>
      </ul>
  </div>
</template>
