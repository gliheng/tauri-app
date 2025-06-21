<template>
  <main
    class="min-h-[calc(100vh-var(--ui-header-height))] flex flex-col items-center justify-center text-center !min-h-96"
  >
    <p class="text-base font-semibold text-primary">404</p>
    <h1
      class="mt-2 text-4xl sm:text-5xl font-bold text-highlighted text-balance"
    >
      Page not found
    </h1>
    <p class="mt-4 text-lg text-muted text-balance">
      The page you are looking for does not exist.
    </p>
    <div class="mt-8 flex items-center justify-center gap-6">
      <UButton color="primary" @click="$router.push('/')">
        Back to home
      </UButton>
    </div>
  </main>
  <template> </template>
</template>
