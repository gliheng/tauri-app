<template>
  <div class="loader"></div>
  <slot />
</template>

<script lang="ts" setup></script>

<style lang="scss" scoped>
.loader {
  width: 108px;
  height: 16px;
  background:
    radial-gradient(
      circle at 8px 8px,
      var(--ui-color-primary-500) 0%,
      var(--ui-color-primary-500) 8px,
      transparent 8px,
      transparent 100%
    ),
    radial-gradient(
      circle at 8px 8px,
      var(--ui-color-primary-500) 0%,
      var(--ui-color-primary-500) 8px,
      transparent 8px,
      transparent 100%
    );
  background-size: 16px 16px;
  background-repeat: no-repeat;
  position: relative;
  animation: ballX 1s linear infinite;
}
.loader:before {
  content: "";
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--ui-color-primary-500);
  inset: 0;
  margin: auto;
  animation: moveX 1s cubic-bezier(0.5, 300, 0.5, -300) infinite;
}
@keyframes ballX {
  0%,
  25%,
  50%,
  75%,
  100% {
    background-position:
      25% 0,
      75% 0;
  }
  40% {
    background-position:
      25% 0,
      85% 0;
  }
  90% {
    background-position:
      15% 0,
      75% 0;
  }
}
@keyframes moveX {
  100% {
    transform: translate(0.15px);
  }
}
</style>
