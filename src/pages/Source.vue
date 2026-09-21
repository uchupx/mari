<script setup lang="ts">
import { sourceService } from '@/services';
import { SourceDataClass } from '@/types/api';
import {onMounted} from 'vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const sources = ref<SourceDataClass[]>([]);
const APIUrl = import.meta.env.SUWAYOMI_SERVER_URL

onMounted(() => {
  sourceService.getSources().then((sourcesData) => {
    sources.value = sourcesData;
    console.log(sourcesData);
  });
});

const gotoSource = (sourceId: string | number) => {
  router.push(`/source/${sourceId}`);
};
</script>
<template>
  <div class="flex gap-4 px-3 py-4 flex-wrap">
      <template v-for="source in sources" :key="source.id">
        <div class="card bg-base-100 w-[calc(50%-0.5rem)] shadow-sm dark:border dark:border-white/10" @click="gotoSource(source.id)">
          <figure>
            <img
              :src="APIUrl + source.iconUrl"
              alt="{{ source.name }}" />
          </figure>
          <div class="card-body h-8">
            <h2 class="card-title">{{ source.name }}</h2>
          </div>
        </div>
        </template>
      </div>
</template>
