<script setup lang="ts">
import { PropType } from 'vue';

interface PermissionOption {
  optionId: string;
  name: string;
  kind: 'allow_always' | 'allow_once' |  'reject_always' | 'reject_once';
}

const props = defineProps({
  options: {
    type: Array as PropType<PermissionOption[]>,
  },
});

const emit = defineEmits<{ close: [string | null] }>();

const getOptionColor = (kind: PermissionOption['kind']) => {
  if (kind.startsWith('allow')) return 'success';
  if (kind.startsWith('reject')) return 'error';
  return 'neutral';
};

const getOptionVariant = (kind: PermissionOption['kind']) => {
  if (kind.endsWith('always')) return 'solid';
  return 'outline';
};

const getOptionIcon = (kind: PermissionOption['kind']) => {
  if (kind.startsWith('allow')) return 'i-lucide-check';
  if (kind.startsWith('reject')) return 'i-lucide-x';
  return 'i-lucide-circle';
};

const handleSelect = (optionId: string) => {
  emit('close', optionId);
};

const handleCancel = () => {
  emit('close', null);
};
</script>

<template>
  <UModal 
    title="Permission Required" 
    description="Please select an option to continue"
    :close="{ onClick: handleCancel }"
  >
    <template #body>
      <div class="flex flex-col gap-3">
        <UButton
          v-for="option in options"
          :key="option.optionId"
          :label="option.name"
          :color="getOptionColor(option.kind)"
          :variant="getOptionVariant(option.kind)"
          :icon="getOptionIcon(option.kind)"
          block
          @click="handleSelect(option.optionId)"
        />
      </div>
    </template>
  </UModal>
</template>

<style lang="scss" scoped>
</style>