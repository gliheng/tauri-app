<script setup lang="ts">
  
</script>

<template>
  <div class="h-full">
    <Suspense>
      <CodeEditor cwd="/Users/juju/Develop/tauri-app" />
      <template #fallback>
        <div class="h-30 flex items-center justify-center">
          <Loader />
        </div>
      </template>
    </Suspense>
  </div>
</template>

<style lang="scss" scoped>
</style>