<script setup lang="ts">
import { ref, computed, useSlots } from 'vue';
import { usePointerSwipe } from '@vueuse/core';

const props = withDefaults(
  defineProps<{
    actionWidth?: number;
    disabled?: boolean;
    swipeable?: boolean;
  }>(),
  {
    actionWidth: 80,
    disabled: false,
    swipeable: true,
  }
);

const emit = defineEmits<{
  (e: 'click', event: Event): void;
  (e: 'action'): void;
}>();

const slots = useSlots();
const hasAction = computed(() => !props.disabled && props.swipeable && !!slots.action);

const target = ref<HTMLElement | null>(null);
let lastSwipeEndTime = 0;

const { distanceX, isSwiping } = usePointerSwipe(target, {
  threshold: 10,
  disableTextSelect: true,
  onSwipeEnd(_e, direction) {
    if (!hasAction.value) return;
    lastSwipeEndTime = Date.now();

    const threshold = props.actionWidth * 0.75;
    if (direction === 'left' && distanceX.value >= threshold) {
      emit('action');
    }
  },
});

const currentOffset = computed(() => {
  if (!hasAction.value) return 0;
  if (isSwiping.value) {
    return Math.min(0, Math.max(-props.actionWidth * 1.5, -distanceX.value));
  }
  return 0;
});

const handleClick = (e: Event) => {
  if (hasAction.value && (isSwiping.value || Date.now() - lastSwipeEndTime < 300)) {
    e.stopPropagation();
    return;
  }

  emit('click', e);
};
</script>

<template>
  <li class="relative overflow-hidden list-none bg-base-100 border-b border-base-200/50 last:border-b-0 select-none">
    <div
      v-if="hasAction"
      class="absolute inset-y-0 right-0 flex items-stretch z-0"
      :style="{ width: `${actionWidth}px` }"
      @click.stop="emit('action')"
    >
      <slot name="action" />
    </div>

    <div
      ref="target"
      class="relative z-10 w-full bg-base-100 cursor-pointer"
      :class="{ 'touch-pan-y': hasAction }"
      :style="{
        transform: `translateX(${currentOffset}px)`,
        transition: isSwiping && hasAction ? 'none' : 'transform 0.25s ease-out',
      }"
      tabindex="0"
      @click="handleClick"
      @keydown.enter="handleClick"
    >
      <slot />
    </div>
  </li>
</template>
