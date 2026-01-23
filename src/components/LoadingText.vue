<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Motion, AnimatePresence } from 'motion-v';

const props = defineProps<{
  text?: string;
  variations?: string[];
}>();

const loadingVariations = [
  "Conjuring brilliance ✨",
  "Weaving magic 🪄",
  "Brewing genius 🧙‍♂️",
  "Summoning wisdom 🔮",
  "Crafting wonders 💫"
];

const currentIndex = ref(0);
const displayText = ref(props.text || loadingVariations[0]);
let intervalId: number | null = null;

onMounted(() => {
  if (!props.text && props.variations !== undefined ? props.variations.length > 1 : true) {
    const texts = props.variations || loadingVariations;
    intervalId = window.setInterval(() => {
      currentIndex.value = (currentIndex.value + 1) % texts.length;
      displayText.value = texts[currentIndex.value];
    }, 3000);
  }
});

onUnmounted(() => {
  if (intervalId !== null) {
    clearInterval(intervalId);
  }
});
</script>

<template>
  <div class="animate-bounce">
    <AnimatePresence :mode="'wait'">
      <Motion
        v-if="!props.text"
        :key="displayText"
        :initial="{ opacity: 0, y: 20, scale: 0.95 }"
        :enter="{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } }"
        :exit="{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.3, ease: 'easeIn' } }"
      >
        <p class="btn-shine">{{ displayText }}</p>
      </Motion>
      <Motion
        v-else
        :initial="{ opacity: 0, y: 20, scale: 0.95 }"
        :enter="{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } }"
      >
        <p class="btn-shine">{{ props.text }}</p>
      </Motion>
    </AnimatePresence>
  </div>
</template>

<style lang="scss" scoped>
.btn-shine {
  color: #fff;
  background: linear-gradient(to right, #9f9f9f 0, #fff 10%, #868686 20%);
  background-position: 0;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shine 3s infinite linear;
  animation-fill-mode: forwards;
  -webkit-text-size-adjust: none;
  white-space: nowrap;
}
@-moz-keyframes shine {
  0% {
    background-position: 0;
  }
  60% {
    background-position: 180px;
  }
  100% {
    background-position: 180px;
  }
}
@-webkit-keyframes shine {
  0% {
    background-position: 0;
  }
  60% {
    background-position: 180px;
  }
  100% {
    background-position: 180px;
  }
}
@-o-keyframes shine {
  0% {
    background-position: 0;
  }
  60% {
    background-position: 180px;
  }
  100% {
    background-position: 180px;
  }
}
@keyframes shine {
  0% {
    background-position: 0;
  }
  60% {
    background-position: 180px;
  }
  100% {
    background-position: 180px;
  }
}
</style>