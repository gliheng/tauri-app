<script setup lang="ts">
withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg';
}>(), {
  size: 'md',
})

const containerSize = {
  'sm': 'size-4',
  'md': 'size-8',
  'lg': 'size-10',
};

const borderSize = {
  'sm': 'border-2',
  'md': 'border-3',
  'lg': 'border-4',
};
</script>

<template>
  <div class="relative flex" :class="containerSize[size]">
    <i class="border-primary animate-spinner-ease-spin absolute h-full w-full rounded-full border-solid border-t-transparent border-r-transparent border-l-transparent"
      :class="borderSize[size]">
    </i>
    <i class="border-primary animate-spinner-linear-spin absolute h-full w-full rounded-full border-dotted border-t-transparent border-r-transparent border-l-transparent opacity-75"
      :class="borderSize[size]">
    </i>
  </div>
</template>

<style lang="scss" scoped>
.animate-spinner-ease-spin {
  animation: spinner-spin .8s infinite;
}

.animate-spinner-linear-spin {
  animation: spinner-spin .8s linear infinite
}

@keyframes spinner-spin {
  0% {
    transform:rotate(0)
  }
  to {
    transform:rotate(1turn)
  }
}
</style>
