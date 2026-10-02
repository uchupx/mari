<script setup lang="ts">
import { onMounted, ref } from 'vue';

const appVersion = ref(__APP_VERSION__);
onMounted(() => {
  console.log(__APP_VERSION__);
});
</script>

<template>
  <div class="p-4">
    <div class="mt-4">
        <ul class="list bg-base-100 rounded-box shadow-md">

          <li class="p-4 pb-2 text-xs opacity-60 tracking-wide">App Information</li>

          <li class="list-row">
            <div class="p-2 rounded-xl border border-white/50"">
                <img class="size-10" alt="Tailwind CSS list item" src="../assets/Favicons/favicon-310x310.png"/>
            </div>
            <div>
              <div>Mari</div>
              <div class="text-xs uppercase font-semibold opacity-60">App Version</div>
              <div class="text-xs opacity-60">{{ appVersion }}</div>
            </div>
          </li>
        </ul>
    </div>
  </div>
</template>
